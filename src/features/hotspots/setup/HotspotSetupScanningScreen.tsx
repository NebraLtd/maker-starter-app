/* eslint-disable no-console */
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useHotspotBle } from '@helium/react-native-sdk'
import { ActivityIndicator, Platform } from 'react-native'
import { useAnalytics } from '@segment/analytics-react-native'
import {
  checkMultiple,
  PERMISSIONS,
  PermissionStatus,
  requestMultiple,
} from 'react-native-permissions'
import Box from '../../../components/Box'
import { DebouncedButton } from '../../../components/Button'
import SafeAreaBox from '../../../components/SafeAreaBox'
import Text from '../../../components/Text'
import {
  HotspotSetupNavigationProp,
  HotspotSetupStackParamList,
} from './hotspotSetupTypes'
import sleep from '../../../utils/sleep'
import { useColors } from '../../../theme/themeHooks'
import {
  getEvent,
  Scope,
  SubScope,
  Action,
} from '../../../utils/analytics/utils'
import useMount from '../../../utils/useMount'

type Route = RouteProp<HotspotSetupStackParamList, 'HotspotSetupScanningScreen'>

const isReady = (
  statuses: Record<
    | 'android.permission.ACCESS_FINE_LOCATION'
    | 'android.permission.BLUETOOTH_CONNECT'
    | 'android.permission.BLUETOOTH_SCAN',
    PermissionStatus
  >,
) =>
  statuses[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] === 'granted' &&
  statuses[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] === 'granted' &&
  statuses[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] === 'granted'

const REQUIRED_PERMISSIONS = [
  PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
  PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
]

const isAndroid = Platform.OS === 'android'
const SCAN_DURATION = 6000
const HotspotSetupScanningScreen = () => {
  const { t } = useTranslation()
  const { primaryText } = useColors()
  const { startScan, stopScan } = useHotspotBle()
  const { params } = useRoute<Route>()
  const navigation = useNavigation<HotspotSetupNavigationProp>()
  const [ready, setReady] = useState<boolean | undefined>(
    isAndroid ? undefined : true,
  )

  const requestBlePermissions = useCallback(() => {
    if (isAndroid && !ready) {
      requestMultiple(REQUIRED_PERMISSIONS).then((statuses) => {
        setReady(isReady(statuses))
      })
    }
  }, [ready])

  useMount(() => {
    if (!isAndroid) return

    checkMultiple(REQUIRED_PERMISSIONS).then((statuses) => {
      const nextReady = isReady(statuses)
      if (nextReady) {
        setReady(true)
      } else {
        requestBlePermissions()
      }
    })
  })

  const { track } = useAnalytics()

  useEffect(() => {
    if (!ready) return

    const scan = async () => {
      // Segment track for bluetooth scan
      const startTimestamp = Date.now()
      track(
        getEvent({
          scope: Scope.HOTSPOT,
          sub_scope: SubScope.BLUETOOTH_CONNECTION,
          action: Action.STARTED,
        }),
      )

      //   if (Platform.OS === 'android') {
      //     await getBlePermissions()
      //   }

      await startScan((error) => {
        if (error) {
          // TODO: handle error
          console.warn('TODO: Handle error')
          console.error(error)
        }
      })

      await sleep(SCAN_DURATION)
      stopScan()

      // Segment track for bluetooth scan
      const endTimestamp = Date.now()
      track(
        getEvent({
          scope: Scope.HOTSPOT,
          sub_scope: SubScope.BLUETOOTH_CONNECTION,
          action: Action.FINISHED,
        }),
        {
          elapsed_milliseconds: endTimestamp - startTimestamp,
        },
      )

      navigation.replace('HotspotSetupPickHotspotScreen', params)
    }

    scan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return (
    <SafeAreaBox
      backgroundColor="primaryBackground"
      flex={1}
      alignItems="center"
    >
      <Box flex={1} />

      <Text
        marginTop="xl"
        variant="body2"
        numberOfLines={1}
        adjustsFontSizeToFit
        textAlign="center"
      >
        {t('hotspot_setup.ble_scan.title')}
      </Text>
      <Box flex={1} justifyContent="center">
        <ActivityIndicator color={primaryText} />
      </Box>
      <DebouncedButton
        marginBottom="m"
        justifyContent="flex-end"
        onPress={navigation.goBack}
        variant="primary"
        mode="text"
        title={t('hotspot_setup.ble_scan.cancel')}
      />
    </SafeAreaBox>
  )
}

export default HotspotSetupScanningScreen
