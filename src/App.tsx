import 'react-native-gesture-handler'
import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import {
  LogBox,
  Platform,
  StatusBar,
  UIManager,
  useColorScheme,
} from 'react-native'
import * as Sentry from '@sentry/react-native'
import useAppState from 'react-native-appstate-hook'
import { ThemeProvider } from '@shopify/restyle'
import Config from 'react-native-config'
import { useSelector } from 'react-redux'
import MapboxGL from '@react-native-mapbox-gl/maps'
import { useAsync } from 'react-async-hook'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import * as SplashScreen from 'expo-splash-screen'
import {
  NavigationContainer,
  NavigationState,
  PartialState,
} from '@react-navigation/native'
import {
  HotspotBleProvider,
  OnboardingProvider,
  SolanaProvider,
} from '@helium/react-native-sdk'
import {
  createClient,
  AnalyticsProvider,
} from '@segment/analytics-react-native'
import animalName from 'angry-purple-tiger'
import { theme, darkThemeColors, lightThemeColors } from './theme/theme'
import NavigationRoot from './navigation/NavigationRoot'
import { useAppDispatch } from './store/store'
import appSlice, { restoreAppSettings } from './store/user/appSlice'
import { RootState } from './store/rootReducer'
import SecurityScreen from './features/security/SecurityScreen'
import AppLinkProvider from './providers/AppLinkProvider'
import { navigationRef } from './navigation/navigator'
import useMount from './utils/useMount'
import usePrevious from './utils/usePrevious'
import { fetchHotspotsData } from './store/hotspots/hotspotsSlice'
import { fetchInitialData } from './store/helium/heliumDataSlice'
import { getMakerName } from './utils/stakingClient'
import { getEvent, Scope, Action } from './utils/analytics/utils'
import { getAddress } from './utils/secureAccount'
import useCheckWalletLink from './utils/useCheckWalletLink'

interface RouteInfo {
  name: string
  params?: Record<string, any>
}

SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
})

Sentry.init({
  dsn: Config.SENTRY_DSN,
})

const segmentClient = createClient({
  writeKey: Config.SEGMENT_ANALYTICS_KEY,
  trackAppLifecycleEvents: true,
  collectDeviceId: true,
  debug: false,
})

const getActiveRoute = (
  state: NavigationState | PartialState<NavigationState> | undefined,
): RouteInfo => {
  if (!state || typeof state.index !== 'number') {
    return {
      name: 'Unknown',
    }
  }

  const route = state.routes[state.index]

  if (route.state) {
    return getActiveRoute(route.state)
  }

  return {
    name: route.name,
    params: route.params,
  }
}

const App = () => {
  const colorScheme = useColorScheme()

  useCheckWalletLink()

  if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true)
    }
  }

  LogBox.ignoreLogs([
    "Accessing the 'state' property of the 'route' object is not supported.",
    'Setting a timer',
    'Calling getNode() on the ref of an Animated component',
    'Native splash screen is already hidden',
    'No Native splash screen',
    'RCTBridge required dispatch_sync to load',
    'Require cycle',
    'new NativeEventEmitter',
    'EventEmitter.removeListener(',
    'Internal React error:',
  ])

  const { appState } = useAppState()
  const dispatch = useAppDispatch()

  const [deviceLoaded, setDeviceLoaded] = useState(false)

  const hotspots = useSelector(
    (state: RootState) => state.hotspots.hotspots.data,
  )
  const hotspotsLoaded = useSelector(
    (state: RootState) => state.hotspots.hotspotsLoaded,
  )
  const makers = useSelector((state: RootState) => state.heliumData.makers)
  const makersLoaded = useSelector(
    (state: RootState) => state.heliumData.makersLoaded,
  )

  useEffect(() => {
    if (!deviceLoaded && hotspotsLoaded && makersLoaded) {
      const params = hotspots.map((hotspot) => ({
        hotspot_address: hotspot.address,
        hotspot_name: animalName(hotspot.address),
        owner_address: hotspot.owner,
        maker_name: getMakerName(hotspot.payer, makers),
      }))

      segmentClient.track(
        getEvent({
          scope: Scope.HOTSPOT,
          action: Action.LOADED,
        }),
        {
          hotspots: params,
        },
      )

      setDeviceLoaded(true)
    }
  }, [deviceLoaded, hotspots, hotspotsLoaded, makers, makersLoaded])

  const {
    lastIdle,
    isPinRequired,
    authInterval,
    isRestored,
    isRequestingPermission,
    isLocked,
  } = useSelector((state: RootState) => state.app)

  const { walletLinkToken } = useSelector((state: RootState) => state.app)
  const [heliumWallet, setHeliumWallet] = useState<string>()

  useEffect(() => {
    if (!walletLinkToken) {
      if (heliumWallet) {
        setHeliumWallet('')
      }
      return
    }

    getAddress().then(setHeliumWallet)
  }, [heliumWallet, walletLinkToken])

  useMount(() => {
    dispatch(restoreAppSettings())
  })

  useEffect(() => {
    dispatch(fetchInitialData())
  }, [dispatch])

  useEffect(() => {
    MapboxGL.setAccessToken(Config.MAPBOX_ACCESS_TOKEN || '')
  }, [dispatch])

  // handle app state changes
  useEffect(() => {
    if (appState === 'background' && !isLocked) {
      dispatch(appSlice.actions.updateLastIdle())
      return
    }

    const isActive = appState === 'active'
    const now = Date.now()
    const expiration = now - authInterval
    const lastIdleExpired = lastIdle && expiration > lastIdle

    // pin is required and last idle is past user interval, lock the screen
    const shouldLock =
      isActive && isPinRequired && !isRequestingPermission && lastIdleExpired

    if (shouldLock) {
      dispatch(appSlice.actions.lock(true))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState])

  const prevAppState = usePrevious(appState)

  // update data when app comes into foreground from background and is logged in (only every 5 min)
  useEffect(() => {
    if (
      (prevAppState === 'background' || prevAppState === 'inactive') &&
      appState === 'active'
    ) {
      const fiveMinutesAgo = Date.now() - 300000
      if (lastIdle && fiveMinutesAgo > lastIdle) {
        dispatch(fetchInitialData())
        dispatch(fetchHotspotsData())
      }
    }
  }, [appState, dispatch, prevAppState, lastIdle, isLocked])

  // hide splash screen
  useAsync(async () => {
    if (isRestored) {
      try {
        await SplashScreen.hideAsync()
      } catch (e) {
        // not using expo splash screen, should be removed.
      }
    }
  }, [isRestored])

  useEffect(() => {
    // Hide splash after 5 seconds, deal with the consequences?
    const timeout = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {
        // not using expo splash screen
      })
    }, 5000)
    return () => clearInterval(timeout)
  }, [dispatch])

  const colorAdaptedTheme = useMemo(
    () => ({
      ...theme,
      colors: colorScheme === 'light' ? lightThemeColors : darkThemeColors,
    }),
    [colorScheme],
  )

  // Save previous route name for automatic screen tracking in segment
  const [routeName, setRouteName] = useState('Unknown')

  return (
    <AnalyticsProvider client={segmentClient}>
      <SolanaProvider
        rpcEndpoint={Config.SOLANA_RPC_ENDPOINT || ''}
        heliumWallet={heliumWallet}
        // --- devnet provider ---
        // cluster="devnet"
        // solanaStatusOverride="complete"
        // --- mainnet provider ---
        cluster="mainnet-beta"
      >
        <OnboardingProvider
          baseUrl={
            Config.ONBOARDING_BASE_URL ||
            'https://helium-onboarding.nebra.com/api'
            // 'https://onboarding.dewi.org/api'
          }
        >
          <HotspotBleProvider>
            <ThemeProvider theme={colorAdaptedTheme}>
              <BottomSheetModalProvider>
                <SafeAreaProvider>
                  {/* TODO: Will need to adapt status bar for light/dark modes */}
                  {Platform.OS === 'ios' && (
                    <StatusBar barStyle="light-content" />
                  )}
                  {Platform.OS === 'android' && (
                    <StatusBar translucent backgroundColor="transparent" />
                  )}

                  <NavigationContainer
                    ref={navigationRef}
                    onStateChange={(state) => {
                      const newRoute = getActiveRoute(state)

                      if (routeName !== newRoute.name) {
                        segmentClient.screen(newRoute.name, newRoute.params)

                        setRouteName(newRoute.name)
                      }
                    }}
                  >
                    <AppLinkProvider>
                      <NavigationRoot />
                    </AppLinkProvider>
                  </NavigationContainer>
                </SafeAreaProvider>
                <SecurityScreen
                  visible={appState !== 'active' && appState !== 'unknown'}
                />
              </BottomSheetModalProvider>
            </ThemeProvider>
          </HotspotBleProvider>
        </OnboardingProvider>
      </SolanaProvider>
    </AnalyticsProvider>
  )
}

export default Sentry.wrap(App)
