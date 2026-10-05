import api from './axiosConfig';

const baseURL = api.defaults.baseURL || 'http://localhost:8080/api';

export const sendInstructorMessage = async (message) => {
  const response = await api.post('/ai/instructor-copilot', { message });
  return response.data;
};

export const sendStudentMessage = async (message) => {
  const response = await api.post('/ai/student-assistant', { message });
  return response.data;
};

// Process buffer chunks for Server-Sent Events (SSE)
const processBuffer = (currentBuffer, onToken) => {
  const lines = currentBuffer.split('\n');
  const remaining = lines.pop() || '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (trimmed.startsWith('data:')) {
      const dataContent = trimmed.substring(5).trim();
      if (dataContent === '[DONE]') {
        continue;
      }
      
      try {
        const parsed = JSON.parse(dataContent);
        // Backend could return {"token": "value"}, {"reply": "value"}, etc.
        const token = parsed.token ?? parsed.text ?? parsed.reply ?? parsed.content ?? parsed.message ?? '';
        if (token) {
          onToken(token);
        } else if (typeof parsed === 'string') {
          onToken(parsed);
        }
      } catch (e) {
        // Fallback for non-JSON content
        onToken(dataContent);
      }
    }
  }
  
  return remaining;
};

export const streamStudentMessage = async (message, onToken, onDone, onError) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseURL}/ai/student-assistant`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        window.location.href = '/login';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (buffer) {
          processBuffer(buffer, onToken);
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      buffer = processBuffer(buffer, onToken);
    }
    
    if (onDone) onDone();
  } catch (error) {
    if (onError) onError(error);
    else throw error;
  }
};
