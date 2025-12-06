#!/bin/bash

# This hook runs after dependencies are installed
# Configure Podfile for React Native Firebase compatibility

if [ "$EAS_BUILD_PLATFORM" = "ios" ]; then
  echo "EAS Hook: Configuring Podfile for React Native Firebase"
  
  PODFILE_PATH="ios/Podfile"
  
  if [ -f "$PODFILE_PATH" ]; then
    echo "EAS Hook: Adding post_install configuration"
    
    # Check if post_install hook exists
    if grep -q "post_install do |installer|" "$PODFILE_PATH"; then
      echo "EAS Hook: post_install already exists, appending configuration"
      # Insert before the final 'end' of post_install
      sed -i.bak '/post_install do |installer|/,/^end$/ {
        /^end$/ i\
\  # React Native Firebase configuration\
\  installer.pods_project.targets.each do |target|\
\    target.build_configurations.each do |config|\
\      config.build_settings["CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES"] = "YES"\
\    end\
\  end
      }' "$PODFILE_PATH"
    else
      echo "EAS Hook: Creating new post_install hook"
      cat >> "$PODFILE_PATH" << 'EOF'

# React Native Firebase configuration
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
    end
  end
end
EOF
    fi
    
    echo "EAS Hook: Podfile configured successfully"
  else
    echo "EAS Hook: Warning - Podfile not found at $PODFILE_PATH"
  fi
fi
