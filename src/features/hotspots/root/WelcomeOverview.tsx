import { isEqual } from 'lodash'
import React, { useEffect, useState, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'
import { View, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Box from '../../../components/Box'
import EmojiBlip from '../../../components/EmojiBlip'
import Text from '../../../components/Text'
import Button from '../../../components/Button'
import { RootState } from '../../../store/rootReducer'
import animateTransition from '../../../utils/animateTransition'
import { useAppDispatch } from '../../../store/store'
import useMount from '../../../utils/useMount'
import hotspotsSlice, {
  fetchHotspotsData,
} from '../../../store/hotspots/hotspotsSlice'
import TouchableOpacityBox from '../../../components/TouchableOpacityBox'
import { useColors } from '../../../theme/themeHooks'
import { RootNavigationProp } from '../../../navigation/main/tabTypes'

const TimeOfDayTitle = ({ date }: { date: Date }) => {
  const { t } = useTranslation()
  const hours = date.getHours()
  let timeOfDay = t('time.afternoon')
  if (hours >= 4 && hours < 12) {
    timeOfDay = t('time.morning')
  }
  if (hours >= 17 || hours < 4) {
    timeOfDay = t('time.evening')
  }
  return (
    <Text
      variant="h1"
      color="primaryText"
      maxFontSizeMultiplier={1}
      marginTop="s"
    >
      {timeOfDay}
    </Text>
  )
}

const WelcomeOverview = () => {
  const { t } = useTranslation()
  const [bodyText, setBodyText] = useState('')
  const [{ hotspotsLoaded, loadedStatus }, setHasLoadedWelcome] = useState({
    hotspotsLoaded: false,
    loadedStatus: false,
  })

  const rootNav = useNavigation<RootNavigationProp>()

  const hotspots = useSelector(
    (state: RootState) => state.hotspots.hotspots.data,
    isEqual,
  )
  const dispatch = useAppDispatch()

  useMount(() => {
    dispatch(fetchHotspotsData())
  })
  const visibleHotspots = useMemo(() => {
    return hotspots
  }, [hotspots])

  const hotspotsLoading = useSelector(
    (state: RootState) => state.hotspots.hotspotsLoaded,
  )

  const hotspotsLoadingStatus = useSelector(
    (state: RootState) => !state.hotspots.failure,
  )

  const colors = useColors()

  const goToNebraDashboard = useCallback(
    () => rootNav.navigate('HmDashboard'),
    [rootNav],
  )

  const onRefresh = () => {
    setHasLoadedWelcome({
      hotspotsLoaded: false,
      loadedStatus: false,
    })
    dispatch(hotspotsSlice.actions.refresh())
    dispatch(fetchHotspotsData())
  }

  useEffect(() => {
    if (hotspotsLoaded && loadedStatus) return

    const nextLoaded = {
      hotspotsLoaded: hotspotsLoaded || hotspotsLoading,
      loadedStatus: loadedStatus || hotspotsLoadingStatus,
    }

    if (nextLoaded.hotspotsLoaded && nextLoaded.loadedStatus) {
      animateTransition('WelcomeOverview.LoadingChange', {
        enabledOnAndroid: false,
      })
    }

    setHasLoadedWelcome(nextLoaded)
  }, [hotspotsLoaded, hotspotsLoading, loadedStatus, hotspotsLoadingStatus])

  const updateBodyText = useCallback(async () => {
    if (!hotspotsLoaded) return

    const hotspotCount = visibleHotspots.length

    let nextBodyText = ''

    nextBodyText = t('hotspots.owned.hotspot_plural', {
      count: hotspotCount,
    })

    setBodyText(nextBodyText)
  }, [hotspotsLoaded, visibleHotspots.length, t])

  useEffect(() => {
    updateBodyText()
  }, [updateBodyText])

  const [date, setDate] = useState(new Date())
  useEffect(() => {
    const dateTimer = setInterval(() => setDate(new Date()), 300000) // update every 5 min
    return () => clearInterval(dateTimer)
  })

  return (
    <Box alignItems="center" backgroundColor="primaryBackground">
      <EmojiBlip date={date} />
      <TimeOfDayTitle date={date} />
      <Box marginTop="m" marginBottom="l">
        {hotspotsLoaded && loadedStatus ? (
          <Text
            variant="light"
            fontSize={20}
            lineHeight={24}
            textAlign="center"
            color="HelperText"
            maxFontSizeMultiplier={1.2}
          >
            {bodyText}
          </Text>
        ) : (
          <>
            {hotspotsLoaded && !loadedStatus ? (
              <Box>
                <Text
                  variant="light"
                  fontSize={20}
                  lineHeight={24}
                  textAlign="center"
                  color="HelperText"
                  maxFontSizeMultiplier={1.2}
                >
                  {t('hotspots.loading_error')}
                </Text>
                <Button
                  style={{ color: 'HelperText' }}
                  title="Reload"
                  mode="text"
                  onPress={onRefresh}
                />
              </Box>
            ) : (
              <SkeletonPlaceholder speed={3000}>
                <SkeletonPlaceholder.Item
                  height={20}
                  width={320}
                  marginBottom={2}
                  borderRadius={4}
                />
                <SkeletonPlaceholder.Item
                  alignSelf="center"
                  height={20}
                  marginBottom={2}
                  width={280}
                  borderRadius={4}
                />
              </SkeletonPlaceholder>
            )}
          </>
        )}
      </Box>
      <TouchableOpacityBox
        onPress={goToNebraDashboard}
        width="100%"
        padding="m"
        marginBottom="m"
        style={{
          borderColor: colors.primaryText,
          borderWidth: 1,
          backgroundColor: colors.primary,
          flex: 1,
          flexDirection: 'row',
        }}
      >
        <View style={{ flex: 4 }}>
          <Text
            variant="body1"
            color="secondaryText"
            marginBottom="s"
            style={{ textAlign: 'left', fontSize: 17, fontWeight: 'bold' }}
          >
            {t('home.goto.nebra_dashboard.title')}
          </Text>
          <Text
            variant="body1"
            color="secondaryText"
            style={{ textAlign: 'left', fontSize: 11, fontWeight: 'normal' }}
          >
            {t('home.goto.nebra_dashboard.subtitle')}
          </Text>
        </View>

        <View style={{ flex: 1, alignItems: 'center', alignSelf: 'center' }}>
          <Image source={require('../../../assets/images/goto.png')} />
        </View>
      </TouchableOpacityBox>
    </Box>
  )
}

export default memo(WelcomeOverview)
