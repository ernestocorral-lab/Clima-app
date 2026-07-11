const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const gradlePropsPath = path.join(root, 'android', 'gradle.properties');
const localPropsPath = path.join(root, 'android', 'local.properties');

const sdkDir = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (sdkDir) {
  const escaped = sdkDir.replace(/\\/g, '\\\\');
  fs.writeFileSync(localPropsPath, `sdk.dir=${escaped}\n`);
}

if (!fs.existsSync(gradlePropsPath)) {
  process.exit(0);
}

let gradleProps = fs.readFileSync(gradlePropsPath, 'utf8');

const replacements = {
    'reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64':
    'reactNativeArchitectures=arm64-v8a',
  'expo.gif.enabled=true': 'expo.gif.enabled=false',
  'expo.webp.enabled=true': 'expo.webp.enabled=false',
  'android.enableMinifyInReleaseBuilds=false': 'android.enableMinifyInReleaseBuilds=true',
  'android.enableShrinkResourcesInReleaseBuilds=false':
    'android.enableShrinkResourcesInReleaseBuilds=true',
};

for (const [from, to] of Object.entries(replacements)) {
  if (gradleProps.includes(from)) {
    gradleProps = gradleProps.replace(from, to);
  }
}

if (!gradleProps.includes('android.enableMinifyInReleaseBuilds=')) {
  gradleProps += '\nandroid.enableMinifyInReleaseBuilds=true\n';
}
if (!gradleProps.includes('android.enableShrinkResourcesInReleaseBuilds=')) {
  gradleProps += 'android.enableShrinkResourcesInReleaseBuilds=true\n';
}

fs.writeFileSync(gradlePropsPath, gradleProps);
