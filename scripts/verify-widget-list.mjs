function hasWidgetDimensions(info) {
  return info.width > 0 && info.height > 0;
}

function isWidgetInstance(info) {
  return info.widgetId > 0;
}

function getPlacedWidgetInstances(widgetInfos) {
  return widgetInfos.filter((info) => isWidgetInstance(info) && hasWidgetDimensions(info));
}

function isUserConfiguredWidget(config) {
  return config?.configured === true;
}

function pruneOrphanWidgetConfigs(activeWidgetIds, storedConfigs) {
  const removed = [];

  for (const widgetId of Object.keys(storedConfigs)) {
    const id = Number(widgetId);
    if (!Number.isFinite(id) || activeWidgetIds.has(id)) {
      continue;
    }

    removed.push(id);
  }

  return removed;
}

function loadResolvedWidgetEntries(widgetInfos, storedConfigs) {
  const placedWidgetIds = new Set(
    getPlacedWidgetInstances(widgetInfos).map((info) => info.widgetId),
  );

  const entries = [];

  for (const [widgetId, config] of Object.entries(storedConfigs)) {
    const id = Number(widgetId);
    if (!Number.isFinite(id) || !placedWidgetIds.has(id) || !isUserConfiguredWidget(config)) {
      continue;
    }

    entries.push({ widgetId: id, cityId: config.cityId });
  }

  return entries.sort((left, right) => left.widgetId - right.widgetId);
}

let failed = 0;

const restoredBackup = loadResolvedWidgetEntries([], {
  11: { cityId: 'city-1', chartType: 'temperature', configured: true },
});
if (restoredBackup.length !== 0) {
  console.error('Expected restored backup config to stay hidden without home-screen widgets');
  failed += 1;
} else {
  console.log('OK: restored backup config stays hidden without home-screen widgets');
}

const liveWidget = loadResolvedWidgetEntries(
  [{ widgetId: 11, widgetName: 'TemperatureWidget', width: 250, height: 110 }],
  {
    11: { cityId: 'city-1', chartType: 'temperature', configured: true },
  },
);
if (liveWidget.length !== 1 || liveWidget[0].cityId !== 'city-1') {
  console.error('Expected live city-1 widget to appear when Android reports it');
  failed += 1;
} else {
  console.log('OK: live city-1 widget appears when Android reports it');
}

const orphanRemoved = pruneOrphanWidgetConfigs(new Set([11]), {
  11: { cityId: 'city-1', chartType: 'temperature', configured: true },
  99: { cityId: 'city-2', chartType: 'temperature', configured: true },
});
if (!orphanRemoved.includes(99) || orphanRemoved.includes(11)) {
  console.error('Expected orphan widget configs to be removed');
  failed += 1;
} else {
  console.log('OK: orphan widget configs are removed');
}

const phantomWithoutConfig = loadResolvedWidgetEntries(
  [{ widgetId: 9, widgetName: 'MetricWidget', width: 56, height: 56 }],
  {},
);
if (phantomWithoutConfig.length !== 0) {
  console.error('Expected widget without configured storage entry to stay hidden');
  failed += 1;
} else {
  console.log('OK: widget without configured storage entry stays hidden');
}

const phantomWithoutDimensions = loadResolvedWidgetEntries(
  [{ widgetId: 11, widgetName: 'TemperatureWidget', width: 0, height: 0 }],
  {
    11: { cityId: 'city-1', chartType: 'temperature', configured: true },
  },
);
if (phantomWithoutDimensions.length !== 0) {
  console.error('Expected widget without dimensions to stay hidden even with stored config');
  failed += 1;
} else {
  console.log('OK: widget without dimensions stays hidden even with stored config');
}

const previewEntry = loadResolvedWidgetEntries(
  [{ widgetId: 0, widgetName: 'TemperatureWidget', width: 250, height: 110 }],
  {
    0: { cityId: 'city-1', chartType: 'temperature', configured: true },
  },
);
if (previewEntry.length !== 0) {
  console.error('Expected launcher preview widget id 0 to stay hidden');
  failed += 1;
} else {
  console.log('OK: launcher preview widget stays hidden');
}

if (failed > 0) {
  process.exit(1);
}

console.log('OK: widget list follows placed Android home-screen widgets only');
