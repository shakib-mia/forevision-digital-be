const express = require("express");
const acrcloud = require("acrcloud");
const axios = require("axios");
const fs = require("fs").promises;
const crypto = require("crypto");
const path = require("path");
const { spawn } = require("child_process");
const { getCollections } = require("../constants");
const router = express.Router();

// ACRCloud setup
const acr = new acrcloud({
  host: "identify-ap-southeast-1.acrcloud.com",
  access_key: "d95dfd4e42c409415ede1e4c6d64b0b1",
  access_secret: "3THFjDOQX7PkTV2ujBvertf5qdtxTo135PjCgYKm",
});

// Utility function to validate URLs
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Utility function to clean up temporary files
const cleanupTempFile = async (filePath) => {
  try {
    if (filePath) {
      await fs.access(filePath); // Check if file exists
      await fs.unlink(filePath); // Delete the file
      console.log(`Temporary file ${filePath} deleted successfully.`);
    }
  } catch (error) {
    console.error(`Error cleaning up file ${filePath}:`, error);
  }
};

// Function to get audio duration using FFmpeg
const getAudioDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);

    let duration = "";
    let error = "";

    ffprobe.stdout.on("data", (data) => {
      duration += data.toString();
    });

    ffprobe.stderr.on("data", (data) => {
      error += data.toString();
    });

    ffprobe.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`FFprobe failed: ${error}`));
      } else {
        resolve(parseFloat(duration.trim()));
      }
    });
  });
};

// Function to calculate timestamps based on duration
const calculateTimestamps = (duration) => {
  return {
    start: {
      time: "00:00:00",
      duration: "00:00:20",
    },
    middle: {
      time: formatTime(duration * 0.4), // 40% into the song
      duration: "00:00:20",
    },
    end: {
      time: formatTime(Math.max(0, duration * 0.8)), // 80% into the song
      duration: "00:00:20",
    },
  };
};

// Function to format time in HH:MM:SS format
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(remainingSeconds).padStart(2, "0")}`;
};

// Function to trim audio and identify it via ACRCloud
const trimAndIdentify = async (filePath, startTime, duration) => {
  return new Promise((resolve, reject) => {
    const audioBuffer = [];
    let ffmpegError = "";

    const ffmpeg = spawn("ffmpeg", [
      "-i",
      filePath,
      "-ss",
      startTime,
      "-t",
      duration,
      "-f",
      "mp3",
      "-acodec",
      "libmp3lame",
      "-ar",
      "44100",
      "-ac",
      "2",
      "-b:a",
      "192k",
      "-",
    ]);

    ffmpeg.stdout.on("data", (data) => {
      if (Buffer.isBuffer(data)) {
        audioBuffer.push(data);
      }
    });

    ffmpeg.stderr.on("data", (data) => {
      ffmpegError += data.toString();
    });

    ffmpeg.on("close", async (code) => {
      if (code !== 0) {
        return reject(
          new Error(`FFmpeg failed (code ${code}): ${ffmpegError}`)
        );
      }

      try {
        const finalAudioBuffer = Buffer.concat(audioBuffer);
        if (finalAudioBuffer.length === 0) {
          throw new Error("Generated audio buffer is empty");
        }

        const result = await acr.identify(finalAudioBuffer);
        console.log(result);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    ffmpeg.on("error", (err) => {
      reject(new Error(`FFmpeg process error: ${err.message}`));
    });
  });
};

// Helper function to format ACR Cloud results
const formatResult = (result, partName) => {
  if (result.error) {
    return { error: result.error };
  }

  console.log(result);

  // Check for both `music` and `humming` metadata
  const metadata = result.metadata;
  const isMusic = metadata?.music && metadata.music[0];
  const isHumming = metadata?.humming && metadata.humming[0];

  if (!isMusic && !isHumming) {
    return { message: `No identifiable audio in ${partName.toLowerCase()}` };
  }

  // Extract details based on the presence of `music` or `humming`
  const item = isMusic ? metadata.music[0] : metadata.humming[0];
  const type = isMusic ? "Music" : "Humming";

  return {
    type, // Indicates whether it's a music or humming result
    ...item,
  };
};

const fetchSongByAcrid = async (acrid) => {
  console.clear();
  const host = "identify-ap-southeast-1.acrcloud.com"; // Your region
  const accessKey = "d95dfd4e42c409415ede1e4c6d64b0b1";
  const accessSecret = "3THFjDOQX7PkTV2ujBvertf5qdtxTo135PjCgYKm";
  const httpMethod = "POST";
  const httpUri = "/v1/identify";
  const dataType = "audio"; // Fixed value
  const signatureVersion = "1";
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Create the string to sign
  const stringToSign = [
    httpMethod,
    httpUri,
    accessKey,
    dataType,
    signatureVersion,
    timestamp,
  ].join("\n");

  // Generate the signature
  const signature = crypto
    .createHmac("sha1", accessSecret)
    .update(stringToSign)
    .digest("base64");

  try {
    const response = await axios.post(
      `https://${host}${httpUri}`,
      {
        acrid, // ACRCloud ID for the song
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          access_key: accessKey,
          data_type: dataType,
          signature_version: signatureVersion,
          signature,
          timestamp,
        },
      }
    );

    console.log("Song Metadata:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching song:", error);
    throw error;
  }
};

router.post("/:orderId", async (req, res) => {
  const { testReports } = await getCollections();
  let tempFilePath = null;

  try {
    const { songUrl } = req.body;
    const orderId = req.params.orderId;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required." });
    }

    if (!songUrl || !isValidUrl(songUrl)) {
      return res.status(400).json({ error: "Valid song URL is required." });
    }

    // Check if the order ID exists in the database
    const existingReport = await testReports.findOne({ orderId });

    if (existingReport) {
      // If the report exists, return it
      return res.status(200).json({
        success: true,
        message: "Data fetched from the database.",
        data: existingReport,
      });
    }

    // Download the audio file
    const response = await axios.get(songUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxContentLength: 1000 * 1024 * 1024,
    });

    // Save the audio file temporarily
    tempFilePath = path.join(__dirname, `temp_${Date.now()}.mp3`);
    await fs.writeFile(tempFilePath, Buffer.from(response.data));

    // Get audio duration
    const duration = await getAudioDuration(tempFilePath);
    const timestamps = calculateTimestamps(duration);

    // Process the three parts
    const [firstPart, middlePart, lastPart] = await Promise.all([
      trimAndIdentify(
        tempFilePath,
        timestamps.start.time,
        timestamps.start.duration
      ),
      trimAndIdentify(
        tempFilePath,
        timestamps.middle.time,
        timestamps.middle.duration
      ),
      trimAndIdentify(
        tempFilePath,
        timestamps.end.time,
        timestamps.end.duration
      ),
    ]);

    // Format results
    const formattedResults = {
      firstPart: formatResult(firstPart, "First part (0%)"),
      middlePart: formatResult(middlePart, "Middle part (40%)"),
      lastPart: formatResult(lastPart, "Last part (80%)"),
    };

    // Fetch song metadata by ACRCloud ID (example using first part's ACRCloud result)
    const acrid = formattedResults.firstPart.acrid; // Assuming ACR ID exists in the result
    let songMetadata = null;

    if (acrid) {
      try {
        songMetadata = await fetchSongByAcrid(acrid);
      } catch (fetchError) {
        console.error("Error fetching song metadata:", fetchError.message);
      }
    }

    // Prepare the test report
    const testReport = {
      success: true,
      duration: duration,
      timestamps: timestamps,
      data: formattedResults,
      songMetadata, // Include additional song metadata if available
    };

    // Save test report to the database
    const dbBody = {
      orderId: orderId,
      ...testReport,
    };

    await testReports.insertOne(dbBody);

    res.status(200).json({
      success: true,
      message: "Data processed successfully.",
      data: testReport,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process audio file",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    // Clean up temporary file after processing
    if (tempFilePath) {
      await cleanupTempFile(tempFilePath);
    }
  }
});

module.exports = router;
