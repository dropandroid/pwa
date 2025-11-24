
export const calculateDaysRemaining = (endDate: string): number => {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export const getDaysElapsed = (startDate: string): number => {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const today = new Date();
  // If start date is in the future, 0 days have elapsed.
  if (start > today) return 0;
  const diffTime = today.getTime() - start.getTime();
  // Add 1 to include the start date in the count of days.
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 0;
};

export const getTotalPlanDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};
