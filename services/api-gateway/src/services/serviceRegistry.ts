// services/api-gateway/src/services/serviceRegistry.ts
// #service-discovery #health-check #registry

import { config } from '../config';

interface ServiceStatus {
  name: string;
  url: string;
  healthy: boolean;
  lastCheck: Date;
}

class ServiceRegistry {
  private services: Map<string, ServiceStatus> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeServices();
  }

  // #service-initialization
  private initializeServices(): void {
    Object.entries(config.serviceUrls).forEach(([name, url]) => {
      this.services.set(name, {
        name,
        url,
        healthy: true,
        lastCheck: new Date()
      });
    });
  }

  // #health-check-loop
  startHealthChecks(intervalMs: number = 30000): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [name, service] of this.services) {
        try {
          const response = await fetch(`${service.url}/health`);
          service.healthy = response.ok;
          service.lastCheck = new Date();
        } catch {
          service.healthy = false;
          service.lastCheck = new Date();
        }
      }
    }, intervalMs);
  }

  // #get-healthy-services
  getHealthyServices(): string[] {
    const healthy: string[] = [];
    this.services.forEach((service, name) => {
      if (service.healthy) healthy.push(name);
    });
    return healthy;
  }

  async deregister(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

export const serviceRegistry = new ServiceRegistry();
