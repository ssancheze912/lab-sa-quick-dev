import '@testing-library/jest-dom';
import { notifyManager } from '@tanstack/react-query';

// Configure TanStack Query v5 notifyManager for synchronous test execution.
// - setScheduler: ensures notifications are not deferred via setTimeout(0),
//   making mutation `isSuccess` accessible synchronously after `await act()`.
// - setNotifyFunction: ensures individual callbacks run synchronously
//   instead of being batched asynchronously.
// Reference: https://tanstack.com/query/v5/docs/framework/react/guides/testing
notifyManager.setScheduler((fn) => fn());
notifyManager.setNotifyFunction((fn) => fn());
