const fs = require("fs");
const path = require("path");

const config = {
  project: {
    android: {
      packageName: "com.imouser.myapp",
    },
  },
  assets: [],
  dependencies: {
    "react-native-vector-icons": {
      platforms: {
        android: null,  
      },
    },
    "react-native": {
      platforms: {
        android: {
          packageImportPath: "import com.facebook.react.ReactPackage;",
          packageInstance: "new ReactPackage();",
        },
      },
    },
    "@react-native-firebase/app": {
      platforms: {
        android: {
          packageImportPath:
            "import io.invertase.firebase.app.ReactNativeFirebaseAppPackage;",
          packageInstance: "new ReactNativeFirebaseAppPackage();",
        },
      },
    },
    "@react-native-firebase/messaging": {
      platforms: {
        android: {
          packageImportPath:
            "import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingPackage;",
          packageInstance: "new ReactNativeFirebaseMessagingPackage();",
        },
      },
    },
  },
};

try {
  const filePath = path.join(
    __dirname,
    "android/build/generated/autolinking/autolinking.json"
  );

  // Ensure the directory exists
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  // Write the JSON config
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2));

  console.log("✅ React Native Config generated at:", filePath);
} catch (error) {
  console.error("❌ Error generating config:", error);
}

module.exports = config;
