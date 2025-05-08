
export const isAuthenticated = () => {
    const token = sessionStorage.getItem('accessToken');
    return !!token;
  };
  