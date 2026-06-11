const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export const rateLimit = {
  limit: async (ip: string) => {
    const now = Date.now();
    const windowMs = 10000; // 10 seconds
    const maxRequests = 10;

    const record = rateLimitMap.get(ip);
    
    // Clean up expired records occasionally to prevent memory leaks
    if (Math.random() < 0.1) {
       for (const [key, value] of rateLimitMap.entries()) {
          if (now > value.expiresAt) {
             rateLimitMap.delete(key);
          }
       }
    }

    if (!record || now > record.expiresAt) {
      rateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
      return { success: true };
    }

    if (record.count >= maxRequests) {
      return { success: false };
    }

    record.count++;
    return { success: true };
  }
};
