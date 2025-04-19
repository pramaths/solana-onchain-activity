interface RequestBody {
    [key: string]: any;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    status: number;
  }
  
  export interface ErrorResponse {
    success: false;
    type: "BadRequest" | "Unauthorized" | "RateLimitExceeded" | "ServerError" | "UnknownError";
    status: number;
    message: string;
    serverMessage?: string; // Full server-provided message for debugging
    details?: any;
  }
  
  const apiClient = async <T,>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
    body: RequestBody | FormData | null = null,
  ): Promise<ApiResponse<T> | ErrorResponse> => {
  
    const headers = new Headers();
    if (!(body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    headers.set("X-Phone-Number", '+916364125737');
  
    const options: RequestInit = {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    };
  
    try {
      console.log("Sending request with options:", JSON.stringify(options));
      const response = await fetch(endpoint, options);
      console.log("Received response status:", response.status);
      
      if (method === 'DELETE' && response.status >= 200 && response.status < 300) {
        return {
          success: true,
          data: null as unknown as T,
          status: response.status,
        };
      }
      
      const contentType = response.headers.get('content-type');
      let data: T | null = null;
      
      if (contentType && contentType.includes('application/json') && response.status !== 204) {
        const text = await response.text();
        data = text ? JSON.parse(text) as T : null;
      }
  
      return {
        success: response.ok,
        data: data as T,
        status: response.status,
      };
    } catch (error: unknown) {
      console.error("API request failed:", error);
      return {
        success: false,
        type: "UnknownError",
        status: 0,
        message: "A network error occurred. Please check your connection or contact support.",
        serverMessage: error instanceof Error ? error.message : "Unknown fetch error",
      };
    }
  };
  
  const handleErrorResponse = async (response: Response): Promise<ErrorResponse> => {
    const status = response.status;
    let serverMessage = "No message provided by the server";
    let details = null;
    
    try {
      const errorData = await response.json();
      serverMessage = errorData.message || serverMessage;
      details = errorData.details || null;
    } catch (e) {
      // If we can't parse the JSON, just use the status text
      serverMessage = response.statusText;
    }
  
    switch (status) {
      case 400:
        return {
          success: false,
          type: "BadRequest",
          status,
          message: "Bad request - check your input",
          serverMessage,
          details,
        };
      case 401:
        return {
          success: false,
          type: "Unauthorized",
          status,
          message: "Unauthorized. Please login again!",
          serverMessage,
        };
      case 429:
        return {
          success: false,
          type: "RateLimitExceeded",
          status,
          message: "Rate limit exceeded. Please try again later.",
          serverMessage,
        };
      case 500:
        return {
          success: false,
          type: "ServerError",
          status,
          message: "Internal server error occurred.",
          serverMessage,
        };
      default:
        return {
          success: false,
          type: "UnknownError",
          status,
          message: `An unexpected error occurred (Status: ${status})`,
          serverMessage,
          details,
        };
    }
  };
  
  export default apiClient;