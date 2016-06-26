/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppHub.h"
#import "AppDelegate.h"
#import "RCTRootView.h"
#import "RCTPushNotificationManager.h"
#import "RNGoogleSignin.h"

#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <FBSDKLoginKit/FBSDKLoginKit.h>
#import <FBSDKShareKit/FBSDKShareKit.h>

// @import Batch;

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [AppHub setApplicationID:@"EZ1vdoRGFMd7fbl7fPPt"];
  [AppHub setLogLevel:AHLogLevelDebug];

  // Start Batch.
  // [BatchPush setupPush];
  // [Batch startWithAPIKey:@""];

  NSURL *jsCodeLocation;

  /**
   * Loading JavaScript code - uncomment the one you want.
   *
   * OPTION 1
   * Load from development server. Start the server from the repository root:
   *
   * $ npm start
   *
   * To run on device, change `localhost` to the IP address of your computer
   * (you can get this by typing `ifconfig` into the terminal and selecting the
   * `inet` value under `en0:`) and make sure your computer and iOS device are
   * on the same Wi-Fi network.
   */

   jsCodeLocation = [NSURL URLWithString:@"http://192.168.1.131:8081/index.ios.bundle?platform=ios&dev=false"];

  /**
   * OPTION 2
   * Load from pre-bundled file on disk. The static bundle is automatically
   * generated by "Bundle React Native code and images" build step.
   */

  // jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];

  /**
   * OPTION 3 - AppHub
   *
   * Load cached code and images from AppHub.
   *
   */

    // [AppHub buildManager].cellularDownloadsEnabled = YES;
    // AHBuild *build = [[AppHub buildManager] currentBuild];
    // jsCodeLocation = [build.bundle URLForResource:@"main"
    //                            withExtension:@"jsbundle"];

  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"VentureApp"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [[UIViewController alloc] init];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  // return YES;
  return [[FBSDKApplicationDelegate sharedInstance] application:application
                                    didFinishLaunchingWithOptions:launchOptions];
}

// Facebook App Events
- (void)applicationDidBecomeActive:(UIApplication *)application {
    [FBSDKAppEvents activateApp];
}

// Facebook and Google SDKs
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation
{
    if([[FBSDKApplicationDelegate sharedInstance] application:application
                                                      openURL:url
                                            sourceApplication:sourceApplication
                                                   annotation:annotation])
    {
        return [[FBSDKApplicationDelegate sharedInstance] application:application
                                                                     openURL:url
                                                           sourceApplication:sourceApplication
                                                                  annotation:annotation];
    }

    else if([RNGoogleSignin application:application
                                            openURL:url
                                  sourceApplication:sourceApplication
                                         annotation:annotation])
    {
    return [RNGoogleSignin application:application
                               openURL:url
                     sourceApplication:sourceApplication
                            annotation:annotation];
    }
    else
    {
      return YES;
    }
}

// Required for the notification event.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification
{
  // [BatchPush dismissNotifications];
  [RCTPushNotificationManager didReceiveRemoteNotification:notification];
}
// Required to register for notifications
- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
{
[RCTPushNotificationManager didRegisterUserNotificationSettings:notificationSettings];
}
// Required for the register event.
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
[RCTPushNotificationManager didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

@end
