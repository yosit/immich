import { SystemConfig } from 'src/config';
import { DeepPartial } from 'typeorm';

export const systemConfigStub = {
  enabled: {
    oauth: {
      enabled: true,
      autoRegister: true,
      autoLaunch: false,
      buttonText: 'OAuth',
    },
  },
  disabled: {
    passwordLogin: {
      enabled: false,
    },
  },
  oauthEnabled: {
    oauth: {
      enabled: true,
      autoRegister: false,
      autoLaunch: false,
      buttonText: 'OAuth',
    },
  },
  oauthWithAutoRegister: {
    oauth: {
      enabled: true,
      autoRegister: true,
      autoLaunch: false,
      buttonText: 'OAuth',
    },
  },
  oauthWithMobileOverride: {
    oauth: {
      enabled: true,
      autoRegister: true,
      mobileOverrideEnabled: true,
      mobileRedirectUri: 'http://mobile-redirect',
      buttonText: 'OAuth',
    },
  },
  oauthWithStorageQuota: {
    oauth: {
      enabled: true,
      autoRegister: true,
      defaultStorageQuota: 1,
    },
  },
  deleteDelay30: {
    user: {
      deleteDelay: 30,
    },
  },
  libraryWatchEnabled: {
    library: {
      watch: {
        enabled: true,
      },
    },
  },
  libraryWatchDisabled: {
    library: {
      watch: {
        enabled: false,
      },
    },
  },
  libraryScan: {
    library: {
      scan: {
        enabled: true,
        cronExpression: '0 0 * * *',
      },
    },
  },
  backupEnabled: {
    backup: {
      database: {
        enabled: true,
        cronExpression: '0 0 * * *',
        keepLastAmount: 1,
      },
    },
  },
  machineLearningDisabled: {
    machineLearning: {
      enabled: false,
    },
  },
} satisfies Record<string, DeepPartial<SystemConfig>>;
