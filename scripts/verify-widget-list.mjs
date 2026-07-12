function isWidgetInstance(info) {
  return info.widgetId > 0;
}

function isUserConfiguredWidget(config) {
  return config?.configured === true;
}

function loadResolvedWidgetEntries(widgetInfos, storedConfigs) {
  const infoById = new Map(
    widgetInfos.filter(isWidgetInstance).map((info) => [info.widgetId, info]),
  );

  const entries = [];

  for (const [widgetId, config] of Object.entries(storedConfigs)) {
    const id = Number(widgetId);
    if (!Number.isFinite(id) || !isUserConfiguredWidget(config)) {
      continue;
    }

    entries.push({
      widgetId: id,
      cityId: config.cityId,
      hasPlatformInfo: infoById.has(id),
    });
  }

  return entries.sort((left, right) => left.widgetId - right.widgetId);
}

function pruneUnconfiguredWidgetConfigs(storedConfigs) {
  const removed = [];

  for (const [widgetId, config] of Object.entries(storedConfigs)) {
    const id = Number(widgetId);
    if (!Number.isFinite(id) || config.configured !== true) {
      removed.push(id);
    }
  }

  return removed;
}

let failed = 0;

const fromStorageOnly = loadResolvedWidgetEntries([], {
  7: { cityId: 'current', chartType: 'temperature', configured: true, widgetName: 'TemperatureWidget' },
});
if (fromStorageOnly.length !== 1 || fromStorageOnly[0].widgetId !== 7) {
  console.error('Expected configured widget to appear from storage even without getWidgetInfo');
  failed += 1;
} else {
  console.log('OK: configured widget appears from storage without getWidgetInfo');
}

const platformAndStorageSameId = loadResolvedWidgetEntries(
  [{ widgetId: 7, widgetName: 'TemperatureWidget', width: 250, height: 110 }],
  {
    7: { cityId: 'current', chartType: 'temperature', configured: true, widgetName: 'TemperatureWidget' },
  },
);
if (platformAndStorageSameId.length !== 1 || !platformAndStorageSameId[0].hasPlatformInfo) {
  console.error('Expected configured widget to appear when Android already reports the same id');
  failed += 1;
} else {
  console.log('OK: configured widget appears when Android reports the same id');
}

const phantomWithoutConfig = loadResolvedWidgetEntries(
  [{ widgetId: 9, widgetName: 'MetricWidget', width: 56, height: 56 }],
  {},
);
if (phantomWithoutConfig.length !== 0) {
  console.error('Expected phantom widget without configured storage entry to stay hidden');
  failed += 1;
} else {
  console.log('OK: phantom widget without configured storage entry stays hidden');
}

const staleAutoSaved = loadResolvedWidgetEntries(
  [{ widgetId: 8, widgetName: 'TemperatureWidget', width: 250, height: 110 }],
  {
    8: { cityId: 'city-1', chartType: 'temperature' },
  },
);
if (staleAutoSaved.length !== 0) {
  console.error('Expected legacy auto-saved config without configured flag to stay hidden');
  failed += 1;
} else {
  console.log('OK: legacy auto-saved config stays hidden');
}

const removedUnconfigured = pruneUnconfiguredWidgetConfigs({
  42: { cityId: 'current', chartType: 'temperature', configured: true },
  99: { cityId: 'city-1', chartType: 'temperature', configured: true },
  100: { cityId: 'city-2', chartType: 'temperature', configured: false },
});
if (!removedUnconfigured.includes(100) || removedUnconfigured.includes(42) || removedUnconfigured.includes(99)) {
  console.error('Expected prune to remove only unconfigured configs');
  failed += 1;
} else {
  console.log('OK: prune removes only unconfigured configs');
}

if (failed > 0) {
  process.exit(1);
}

console.log('OK: widget list is storage-driven and hides phantoms');
