const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiCall = async (endpoint, options = {}) => {
  // Retrieve the auth token stored during Counter login
  const token = localStorage.getItem("authToken");

  // Setup default headers safely
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}), 
  };

  // If a token exists, attach it to the Authorization header
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Handle FormData separately (remove Content-Type so the browser sets the boundary automatically)
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Parse JSON response safely
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.message || "An error occurred with the API request.";
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    if (error.message === "Failed to fetch") {
      throw new Error("Server is offline. Please check your backend connection.");
    }
    throw error;
  }
};