export default function getNextYearDate(date = new Date()) {
  console.log(date);
  const nextYearDate = new Date(date);
  nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
  nextYearDate.setDate(nextYearDate.getDate() - 1); // Subtract 1 day to complete the full cycle

  const year = nextYearDate.getFullYear();
  const month = String(nextYearDate.getMonth() + 1).padStart(2, "0");
  const day = String(nextYearDate.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}
