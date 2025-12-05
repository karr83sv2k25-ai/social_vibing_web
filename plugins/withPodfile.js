const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withPodfile(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf-8');
        
        // Add use_modular_headers! if not already present
        if (!podfileContent.includes('use_modular_headers!')) {
          // Add after the platform line
          podfileContent = podfileContent.replace(
            /(platform :ios.*\n)/,
            '$1\nuse_modular_headers!\n'
          );
          
          fs.writeFileSync(podfilePath, podfileContent);
          console.log('✅ Added use_modular_headers! to Podfile');
        }
      }
      
      return config;
    },
  ]);
};
