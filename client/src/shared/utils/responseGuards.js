export const getResponseArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export const getResponseObject = (response) => {
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
    return response;
  }
  return {};
};
