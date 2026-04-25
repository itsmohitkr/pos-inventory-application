export const getSaleHistoryRange = (type) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (type) {
    case 'day':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'yesterday':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      break;
    case 'this_week': {
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    }
    case 'last_week': {
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - diffToMonday - 7,
        0,
        0,
        0,
        0
      );
      end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - diffToMonday - 1,
        23,
        59,
        59,
        999
      );
      break;
    }
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'last_year':
      start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    default:
      break;
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

export const buildInclusiveSaleHistoryRange = (startDate, endDate) => {
  if (!startDate || !endDate) return null;

  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);

  if ([sy, sm, sd, ey, em, ed].some((value) => Number.isNaN(value))) {
    return null;
  }

  const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
  const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};
