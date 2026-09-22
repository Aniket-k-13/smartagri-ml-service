import { MOCK_DELAY_MS } from "./config";

export function mockDelay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}
