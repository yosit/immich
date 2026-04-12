import { Worker } from 'bullmq';
import { QueueName } from 'src/enum';
import { JobRepository } from 'src/repositories/job.repository';
import { mockEnvData } from 'test/repositories/config.repository.mock';
import { vitest } from 'vitest';

vitest.mock('bullmq', () => ({
  Worker: vitest.fn(),
  Queue: vitest.fn(),
  getQueueToken: (name: string) => `BullQueue_${name}`,
}));

describe(JobRepository.name, () => {
  let sut: JobRepository;
  let configMock: { getEnv: ReturnType<typeof vitest.fn> };
  let eventMock: { emit: ReturnType<typeof vitest.fn> };
  let loggerMock: Record<string, ReturnType<typeof vitest.fn>>;
  let moduleRefMock: { get: ReturnType<typeof vitest.fn> };

  beforeEach(() => {
    vitest.clearAllMocks();

    configMock = { getEnv: vitest.fn().mockReturnValue(mockEnvData({})) };
    eventMock = { emit: vitest.fn().mockResolvedValue(undefined) };
    loggerMock = { setContext: vitest.fn(), debug: vitest.fn(), verbose: vitest.fn(), warn: vitest.fn(), error: vitest.fn() };
    moduleRefMock = { get: vitest.fn() };

    sut = new JobRepository(moduleRefMock as any, configMock as any, eventMock as any, loggerMock as any);
  });

  describe('startWorkers', () => {
    it('should create a worker for each queue', () => {
      sut.startWorkers();

      const queueNames = Object.values(QueueName);
      expect(Worker).toHaveBeenCalledTimes(queueNames.length);
      for (const name of queueNames) {
        expect(Worker).toHaveBeenCalledWith(name, expect.any(Function), expect.any(Object));
      }
    });

    it('should set lockDuration high enough to survive event loop blocks', () => {
      sut.startWorkers();

      for (const [, , options] of vitest.mocked(Worker).mock.calls) {
        expect(options.lockDuration).toBeGreaterThan(30_000);
      }
    });

    it('should set stalledInterval to match lockDuration', () => {
      sut.startWorkers();

      for (const [, , options] of vitest.mocked(Worker).mock.calls) {
        expect(options.stalledInterval).toBeGreaterThan(30_000);
      }
    });
  });
});
