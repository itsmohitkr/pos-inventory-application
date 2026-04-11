const getDateRange = (type, customStart = null, customEnd = null) => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  // Helper to reset hours for start/end
  const startOfDay = (d) => {
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const endOfDay = (d) => {
    d.setHours(23, 59, 59, 999);
    return d;
  };

  switch (type) {
    case 'today':
      startOfDay(start);
      endOfDay(end);
      break;

    case 'yesterday':
      start.setDate(now.getDate() - 1);
      startOfDay(start);
      end.setDate(now.getDate() - 1);
      endOfDay(end);
      break;

    case 'thisWeek': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
      start.setDate(diff);
      startOfDay(start);
      endOfDay(end);
      break;
    }

    case 'lastWeek': {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diffToMonday - 7);
      startOfDay(start);
      end.setDate(diffToMonday - 1);
      endOfDay(end);
      break;
    }

    case 'thisMonth':
      start.setDate(1);
      startOfDay(start);
      endOfDay(end);
      break;

    case 'lastMonth':
      start.setMonth(now.getMonth() - 1);
      start.setDate(1);
      startOfDay(start);
      end.setDate(0); // Last day of previous month
      endOfDay(end);
      break;

    case 'thisYear':
      start.setMonth(0, 1);
      startOfDay(start);
      endOfDay(end);
      break;

    case 'lastYear':
      start.setFullYear(now.getFullYear() - 1);
      start.setMonth(0, 1);
      startOfDay(start);
      end.setFullYear(now.getFullYear() - 1);
      end.setMonth(11, 31);
      endOfDay(end);
      break;

    case 'custom':
      if (customStart && customEnd) {
        start = new Date(customStart);
        end = new Date(customEnd);
      } else {
        return { start: null, end: null };
      }
      break;

    default:
      return { start: null, end: null };
  }

  return { start: start.toISOString(), end: end.toISOString() };
};

module.exports = { getDateRange };
