import { dashboardRepository } from "./dashboard.repository";

export const dashboardService = {
  async metrics() {
    return dashboardRepository.metrics();
  },
};


