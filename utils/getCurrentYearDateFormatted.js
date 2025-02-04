export default function getCurrentYearDateFormatted(d = new Date()) {
  const today = new Date(); // Get today's date
  const date = new Date(d);

  // Prevent future dates
  if (date > today) {
    return getCurrentYearDateFormatted(today); // Return today's formatted date
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}
