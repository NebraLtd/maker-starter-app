import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import LogoSVG from '@assets/images/logo_white.svg'
import { View, ImageBackground, Linking } from 'react-native'
import { createWalletLinkUrl } from '@helium/wallet-link'
import { getBundleId } from 'react-native-device-info'
import { useColors } from '../../../theme/themeHooks'
import Text from '../../../components/Text'
import { OnboardingNavigationProp } from '../onboardingTypes'
import TextTransform from '../../../components/TextTransform'
import SafeAreaBox from '../../../components/SafeAreaBox'
import TouchableOpacityBox from '../../../components/TouchableOpacityBox'

const WelcomeScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingNavigationProp>()

  const createAccount = useCallback(
    () => navigation.push('CreateAccount'),
    [navigation],
  )

  const colors = useColors()
  const importAccount = useCallback(() => {
    try {
      const url = createWalletLinkUrl({
        requestAppId: getBundleId(),
        callbackUrl: 'nebrahotspot://',
        appName: 'Nebra Hotspot',
      })

      Linking.openURL(url)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
    }
  }, [])

  return (
    <SafeAreaBox backgroundColor="primary" flex={1}>
      <ImageBackground
        style={{ width: '100%', height: '100%' }}
        source={require('../../../assets/images/Map.png')}
      >
        <View
          style={{
            paddingTop: 20,
            paddingHorizontal: 15,
            justifyContent: 'center',
            alignContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.primaryTransparent,
            width: '100%',
            height: '100%',
          }}
        >
          <View>
            <LogoSVG width="200" height="120" />
          </View>

          <TextTransform
            variant="subtitle1"
            marginVertical="xxl"
            i18nKey="account_setup.welcome.subtitle"
            color="secondaryText"
            style={{ textAlign: 'center' }}
          />

          <TouchableOpacityBox
            onPress={createAccount}
            width="100%"
            padding="m"
            marginBottom="m"
            style={{
              borderColor: colors.secondaryText,
              borderWidth: 1,
            }}
          >
            <Text
              variant="body1"
              color="secondaryText"
              style={{ textAlign: 'center' }}
            >
              {t('account_setup.welcome.create_account')}
            </Text>
          </TouchableOpacityBox>

          <TouchableOpacityBox
            onPress={importAccount}
            width="100%"
            padding="m"
            style={{
              borderColor: colors.secondaryText,
              borderWidth: 1,
            }}
          >
            <Text
              variant="body1"
              color="secondaryText"
              style={{ textAlign: 'center' }}
            >
              {t('account_setup.welcome.login_with_helium')}
            </Text>
          </TouchableOpacityBox>
        </View>
      </ImageBackground>
    </SafeAreaBox>
  )
}

export default WelcomeScreen
