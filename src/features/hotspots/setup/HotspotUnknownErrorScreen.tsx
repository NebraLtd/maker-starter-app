import React, { useCallback } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import Box from '../../../components/Box'
import { DebouncedButton } from '../../../components/Button'
import SafeAreaBox from '../../../components/SafeAreaBox'
import Text from '../../../components/Text'
import { RootNavigationProp } from '../../../navigation/main/tabTypes'
import { HotspotSetupStackParamList } from './hotspotSetupTypes'

type Route = RouteProp<HotspotSetupStackParamList, 'HotspotUnknownErrorScreen'>
const HotspotUnknownErrorScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<RootNavigationProp>()
  const {
    params: { title, subTitle, errorMsg },
  } = useRoute<Route>()
  const navNext = useCallback(() => {
    navigation.navigate('MainTabs')
  }, [navigation])

  return (
    <SafeAreaBox backgroundColor="primaryBackground" flex={1} padding="l">
      <Box flex={1} justifyContent="center" paddingBottom="xxl">
        <Text variant="h1">{title}</Text>
        <Text variant="body1" marginVertical="l">
          {subTitle}
        </Text>
        <Text variant="body2" marginVertical="l">
          {errorMsg}
        </Text>
      </Box>
      <Box>
        <DebouncedButton
          mode="contained"
          variant="primary"
          title={t('hotspot_setup.onboarding_error.next')}
          onPress={navNext}
        />
      </Box>
    </SafeAreaBox>
  )
}

export default HotspotUnknownErrorScreen
