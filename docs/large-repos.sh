git clone --bare https://github.com/torvalds/linux
git clone --bare https://github.com/microsoft/vscode
git clone --bare https://github.com/home-assistant/core
git clone --bare https://github.com/microsoft/PowerToys
git clone --bare https://github.com/Kas-tle/java2bedrock.sh
git clone --bare https://github.com/ultralytics/ultralytics
git clone --bare https://github.com/flutter/flutter
git clone --bare https://github.com/langchain-ai/langchain
git clone --bare https://github.com/Ultimaker/Cura
git clone --bare https://github.com/platformio/platformio-home
git clone --bare https://github.com/Koenkk/zigbee2mqtt

mkdir linux
mkdir vscode
mkdir core
mkdir PowerToys
mkdir java2bedrock.sh
mkdir ultralytics
mkdir flutter
mkdir langchain
mkdir Cura
mkdir platformio-home
mkdir zigbee2mqtt

mv linux.git linux/.git
mv vscode.git vscode/.git
mv core.git core/.git
mv PowerToys.git PowerToys/.git
mv java2bedrock.sh.git java2bedrock.sh/.git
mv ultralytics.git ultralytics/.git
mv flutter.git flutter/.git
mv langchain.git langchain/.git
mv Cura.git Cura/.git
mv platformio-home.git platformio-home/.git
mv zigbee2mqtt.git zigbee2mqtt/.git

mv linux linux
mv vscode vscode
mv core core
mv PowerToys PowerToys
mv java2bedrock.sh java2bedrock.sh
mv ultralytics ultralytics
mv flutter flutter
mv langchain langchain
mv Cura Cura
mv platformio-home platformio-home
mv zigbee2mqtt zigbee2mqtt
