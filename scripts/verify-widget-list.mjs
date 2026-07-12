function hasWidgetDimensions(info) {
  return info.width > 0 && info.height > 0;
}

function isWidgetInstance(info) {
  return info.widgetId > 0;
}

function isUserConfiguredWidget(config) {
  return config?.configured === true;
}

async function resolveWidgetListEntry(info, getConfig) {
  if (!isWidgetInstance(info)) {
    return null;
  }

  const storedConfig = await getConfig(info.widgetId);
  if (!storedConfig) {
    return null;
  }

  const placed = hasWidgetDimensions(info);

  if (isUserConfiguredWidget(storedConfig)) {
    return { widgetId: info.widgetId, cityId: storedConfig.cityId };
  }

  if (storedConfig.configured === false && placed) {
    return { widgetId: info.widgetId, cityId: storedConfig.cityId };
  }

  return null;
}

async function runScenario(name, info, storedConfig) {
  const entry = await resolveWidgetListEntry(info, async () => storedConfig);
  console.log(`OK: ${name} -> ${entry ? `widget ${entry.widgetId}` : 'hidden'}`);
  return entry;
}

let failed = 0;

const firstConfigured = await runScenario(
  'configured widget with zero dimensions',
  { widgetId: 42, widgetName: 'TemperatureWidget', width: 0, height: 0 },
  { cityId: 'current', chartType: 'temperature', configured: true },
);
if (!firstConfigured) {
  console.error('Expected configured widget to appear before Android reports dimensions');
  failed += 1;
}

const phantomWithDimensions = await runScenario(
  'phantom with dimensions and no config flag stays hidden',
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

const taskWidget = await runScenario(
  'task-handler widget on home screen stays visible',
  { widgetId: 9, widgetName: 'MetricWidget', width: 56, height: 56 },
  { cityId: 'city-1', chartType: 'temperature', configured: false },
);
if (!taskWidget) {
  console.error('Expected placed task-handler widget to appear');
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

if (failed > 0) {
  process.exit(1);
}

console.log('OK: widget list resolver hides phantoms and keeps real widgets');
