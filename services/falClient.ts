interface FalInput {
  prompt: string;
  image_url: string;
  [key: string]: any;
}

interface FalSubscribeOptions {
  input: FalInput;
  logs?: boolean;
  onQueueUpdate?: (update: QueueUpdate) => void;
}

interface QueueUpdate {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  logs?: Array<{ message: string; level?: string; timestamp?: string }>;
}

interface FalResult {
  data: any;
  requestId: string;
}

interface FalResponse {
  request_id: string;
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  logs?: Array<{ message: string; level?: string; timestamp?: string }>;
}

class FalClient {
  private apiKey: string;
  private baseUrl = 'https://queue.fal.run';

  constructor() {
    this.apiKey = process.env.FAL_KEY || '';
    if (!this.apiKey) {
      throw new Error('FAL_KEY environment variable is required');
    }
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, message: ${await response.text()}`);
    }

    return response;
  }

  private async submitRequest(model: string, input: FalInput): Promise<string> {
    const url = `${this.baseUrl}/${model}`;
    const response = await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(input),
    });

    const data: FalResponse = await response.json();
    return data.request_id;
  }

  private async getRequestStatus(requestId: string): Promise<FalStatusResponse> {
    const url = `${this.baseUrl}/fal-ai/flux-pro/requests/${requestId}/status`;
    const response = await this.makeRequest(url, {
      method: 'GET',
    });

    return await response.json();
  }

  private async getResult(requestId: string): Promise<any> {
    const url = `${this.baseUrl}/fal-ai/flux-pro/requests/${requestId}`;
    const response = await this.makeRequest(url, {
      method: 'GET',
    });

    return await response.json();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async subscribe(model: string, options: FalSubscribeOptions): Promise<FalResult> {
    const { input, logs = false, onQueueUpdate } = options;

    // Submit the initial request
    const requestId = await this.submitRequest(model, input);

    // Poll for completion
    let status: FalStatusResponse;
    do {
      await this.delay(1000); // Wait 1 second between polls
      status = await this.getRequestStatus(requestId);

      // Call the queue update callback if provided
      if (onQueueUpdate) {
        const update: QueueUpdate = {
          status: status.status,
          logs: status.logs || [],
        };
        onQueueUpdate(update);
      }

      // If we want logs and the status has logs, we can process them
      if (logs && status.logs) {
        status.logs.forEach(log => {
          if (log.message) {
            console.log(log.message);
          }
        });
      }

    } while (status.status === 'IN_QUEUE' || status.status === 'IN_PROGRESS');

    if (status.status === 'FAILED') {
      throw new Error('Request failed');
    }

    // Get the final result
    const data = await this.getResult(requestId);

    return {
      data,
      requestId,
    };
  }
}

// Export a singleton instance
export const fal = new FalClient();
