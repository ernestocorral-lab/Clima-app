function hasWidgetDimensions(info) {
  return info.width > 0 && info.height > 0;
}

function isWidgetInstance(info) {
  return info.widgetId > 0;
}

function isUserConfiguredWidget(config) {
  return config?.configured === true;
}

function isPlacedWidget(info, config) {
  return isUserConfiguredWidget(config) && hasWidgetDimensions(info);
}

async function resolveWidgetListEntry(info, getConfig) {
  if (!isWidgetInstance(info)) {
    return null;
  }

  const storedConfig = await getConfig(info.widgetId);
  if (!storedConfig || !isPlacedWidget(info, storedConfig)) {
    return null;
  }

  return { widgetId: info.widgetId, cityId: storedConfig.cityId };
}

async function pruneStaleWidgetConfigs(activeWidgetIds, storedConfigs) {
  const removed = [];

  for (const [widgetId, config] of Object.entries(storedConfigs)) {
    const id = Number(widgetId);
    if (!Number.isFinite(id) || config.configured !== true || !activeWidgetIds.has(id)) {
      removed.push(id);
    }
  }

  return removed;
}

async function runScenario(name, info, storedConfig) {
  const entry = await resolveWidgetListEntry(info, async () => storedConfig);
  console.log(`OK: ${name} -> ${entry ? `widget ${entry.widgetId}` : 'hidden'}`);
  return entry;
}

let failed = 0;

const configuredPlaced = await runScenario(
  'configured widget on home screen stays visible',
  { widgetId: 42, widgetName: 'TemperatureWidget', width: 250, height: 110 },
  { cityId: 'current', chartType: 'temperature', configured: true },
);
if (!configuredPlaced) {
  console.error('Expected configured placed widget to appear');
  failed += 1;
}

const configuredWithoutDimensions = await runScenario(
  'configured widget without dimensions stays hidden',
  { widgetId: 42, widgetName: 'TemperatureWidget', width: 0, height: 0 },
  { cityId: 'current', chartType: 'temperature', configured: true },
);
if (configuredWithoutDimensions) {
  console.error('Expected configured widget without dimensions to stay hidden');
  failed += 1;
}

const phantomWithDimensions = await runScenario(
  'phantom with dimensions and no config stays hidden',
  { widgetId: 7, widgetName: 'MetricWidget', width: 56, height: 56 },
  null,
);
if (phantomWithDimensions) {
  console.error('Expected phantom widget without config to stay hidden');
  failed += 1;
}

const staleAutoSaved = await runScenario(
  'legacy auto-saved config without configured flag stays hidden',
  { widgetId: 8, widgetName: 'TemperatureWidget', width: 250, height: 110 },
  { cityId: 'city-1', chartType: 'temperature' },
);
if (staleAutoSaved) {
  console.error('Expected stale auto-saved config to stay hidden');
  failed += 1;
}

const taskHandlerOnly = await runScenario(
  'task-handler config without configured flag stays hidden',
  { widgetId: 9, widgetName: 'MetricWidget', width: 56, height: 56 },
  { cityId: 'city-1', chartType: 'temperature', configured: false },
);
if (taskHandlerOnly) {
  console.error('Expected task-handler-only config to stay hidden');
  failed += 1;
}

const preview = await runScenario(
  'preview entry without config stays hidden',
  { widgetId: 0, widgetName: 'TemperatureWidget', width: 250, height: 110 },
  null,
);
if (preview) {
  console.error('Expected preview widget to stay hidden');
  failed += 1;
}

const removedOrphans = await pruneStaleWidgetConfigs(new Set([42]), {
  42: { cityId: 'current', chartType: 'temperature', configured: true },
  99: { cityId: 'city-1', chartType: 'temperature', configured: true },
  100: { cityId: 'city-2', chartType: 'temperature', configured: false },
});
if (!removedOrphans.includes(99) || !removedOrphans.includes(100) || removedOrphans.includes(42)) {
  console.error('Expected prune to remove orphan and unconfigured configs only');
  failed += 1;
} else {
  console.log('OK: prune removes orphan and unconfigured configs');
}

if (failed > 0) {
  process.exit(1);
}

console.log('OK: widget list resolver hides phantoms and keeps real widgets');
