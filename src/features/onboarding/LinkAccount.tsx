import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Platform, Alert } from 'react-native'
import { getBundleId } from 'react-native-device-info'
import {
  createWalletLinkUrl,
  DelegateApp,
  DELEGATE_APPS,
} from '@helium/wallet-link'
import SafeAreaBox from '../../components/SafeAreaBox'
import Text from '../../components/Text'
import Box from '../../components/Box'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { locale } from '../../utils/i18n'

const LinkAccount = () => {
  const { t } = useTranslation()

  const handleAppSelection = useCallback(
    (app: DelegateApp) => async () => {
      try {
        const url = createWalletLinkUrl({
          universalLink: app.universalLink,
          requestAppId: getBundleId(),
          callbackUrl: 'makerappscheme://',
          appName: 'Nebra Hotspot',
        })

        // Check if the wallet URL scheme can be opened.
        const supported = await Linking.canOpenURL(url)
        if (supported) {
          Linking.openURL(url)
        } else {
          Alert.alert(
            'Helium App Not Found',
            'You must have the Helium wallet app installed using the official Android Play Store or iOS App Store.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Get Helium App',
                onPress: () => {
                  if (Platform.OS === 'android') {
                    Linking.openURL(`market://details?id=${app.androidPackage}`)
                  } else if (Platform.OS === 'ios') {
                    Linking.openURL(
                      `https://apps.apple.com/${locale}/app/${app.name}/id${app.appStoreId}`,
                    )
                  }
                },
              },
            ],
          )
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
      }
    },
    [],
  )

  return (
    <SafeAreaBox flex={1} backgroundColor="primaryBackground" padding="xl">
      <Text variant="subtitle1" marginBottom="l">
        {t('account_setup.createAccount.signInWith')}
      </Text>

      <Box flexDirection="column" marginBottom="l">
        {DELEGATE_APPS.map((app) => (
          <TouchableOpacityBox
            key={
              Platform.OS === 'android' ? app.androidPackage : app.iosBundleId
            }
            backgroundColor="surface"
            padding="s"
            marginBottom="m"
            paddingHorizontal="m"
            borderRadius="l"
            onPress={handleAppSelection(app)}
          >
            <Text variant="h4" color="secondaryText">
              {app.name}
            </Text>
          </TouchableOpacityBox>
        ))}
      </Box>
    </SafeAreaBox>
  )
}

export default memo(LinkAccount)
