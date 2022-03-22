import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { getCountry } from 'react-native-localize'
import { KeyboardAvoidingView, StyleSheet } from 'react-native'
import Box from '../../../components/Box'
import {
  HotspotSetupNavigationProp,
  HotspotSetupStackParamList,
} from './hotspotSetupTypes'
import BackScreen from '../../../components/BackScreen'
import Text from '../../../components/Text'
import { DebouncedButton } from '../../../components/Button'
import HotspotConfigurationPicker from '../../../components/HotspotConfigurationPicker'
import { MakerAntenna } from '../../../makers/antennaMakerTypes'
import nebra from '../../../makers/nebra'
import { HotspotMakerModels } from '../../../makers'
import { RootNavigationProp } from '../../../navigation/main/tabTypes'
import { isEUCountry, isUSCountry } from '../../../utils/countries'

type Route = RouteProp<HotspotSetupStackParamList, 'AntennaSetupScreen'>

const AntennaSetupScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<HotspotSetupNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()
  const { params } = useRoute<Route>()

  const handleClose = useCallback(() => rootNav.navigate('MainTabs'), [rootNav])

  const defaultAntenna = useMemo(() => {
    const country = getCountry()
    const makerAntenna = HotspotMakerModels[params.hotspotType]?.antenna

    let makerAntennaDefault = makerAntenna?.default
    if (isUSCountry(country)) makerAntennaDefault = makerAntenna?.us
    else if (isEUCountry(country)) makerAntennaDefault = makerAntenna?.eu

    let antennaDefault = nebra.antennas.NEBRA_US_3
    if (isUSCountry(country)) antennaDefault = nebra.antennas.NEBRA_US_3
    else if (isEUCountry(country)) antennaDefault = nebra.antennas.NEBRA_EU_3

    const ant = makerAntennaDefault || antennaDefault

    return ant
  }, [params.hotspotType])

  const [antenna, setAntenna] = useState<MakerAntenna>(defaultAntenna)
  const [gain, setGain] = useState<number>(defaultAntenna.gain)
  const [elevation, setElevation] = useState<number>(0)

  const navNext = useCallback(async () => {
    if (!antenna) return

    navigation.navigate('HotspotSetupConfirmLocationScreen', {
      ...params,
      gain,
      elevation,
    })
  }, [antenna, elevation, gain, navigation, params])

  return (
    <BackScreen onClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior="padding"
      >
        <Box flex={1} justifyContent="center" paddingBottom="xxl">
          <Box>
            <Text
              variant="h1"
              marginBottom="s"
              marginTop="l"
              maxFontSizeMultiplier={1}
            >
              {t('antennas.onboarding.title')}
            </Text>
            <Text
              variant="subtitle2"
              numberOfLines={2}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.3}
            >
              {t('antennas.onboarding.subtitle')}
            </Text>
          </Box>
          <HotspotConfigurationPicker
            selectedAntenna={antenna}
            onAntennaUpdated={setAntenna}
            onGainUpdated={setGain}
            onElevationUpdated={setElevation}
          />
        </Box>
      </KeyboardAvoidingView>
      <DebouncedButton
        title={t('generic.next')}
        mode="contained"
        variant="primary"
        onPress={navNext}
      />
    </BackScreen>
  )
}

const styles = StyleSheet.create({ keyboardAvoidingView: { flex: 1 } })

export default AntennaSetupScreen
