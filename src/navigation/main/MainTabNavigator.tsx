import React, { useEffect, memo, useMemo } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import Hotspots from '../../features/hotspots/root/HotspotsNavigator'
import { TabBarIconType, MainTabType, RootNavigationProp } from './tabTypes'
import TabBarIcon from './TabBarIcon'
import More from '../../features/moreTab/MoreNavigator'
import Support from '../../features/support/SupportNavigator'
import { RootState } from '../../store/rootReducer'
import { useColors } from '../../theme/themeHooks'
import { useAppDispatch } from '../../store/store'
import { wp } from '../../utils/layout'
import appSlice from '../../store/user/appSlice'
import { openDashboardBrowser } from '../../utils/analytics/utils'

const MainTab = createBottomTabNavigator()

const MainTabs = () => {
  const { surfaceContrast } = useColors()
  const navigation = useNavigation<RootNavigationProp>()
  const {
    app: { isLocked, isSettingUpHotspot },
  } = useSelector((state: RootState) => state)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!isLocked) return
    navigation.navigate('LockScreen', { requestType: 'unlock', lock: true })
  }, [isLocked, navigation])

  useEffect(() => {
    if (!isSettingUpHotspot) return

    dispatch(appSlice.actions.startHotspotSetup())
    navigation.navigate('HotspotSetup')
  }, [isSettingUpHotspot, dispatch, navigation])

  const sceneContainerStyle = useMemo(
    () => ({
      opacity: isLocked ? 0 : 1,
    }),
    [isLocked],
  )

  return (
    <MainTab.Navigator
      sceneContainerStyle={sceneContainerStyle}
      initialRouteName="Hotspots"
      tabBarOptions={{
        showLabel: false,
        style: {
          backgroundColor: surfaceContrast,
          paddingHorizontal: wp(12),
        },
      }}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }: TabBarIconType) => {
          return (
            <TabBarIcon
              name={route.name as MainTabType}
              focused={focused}
              color={color}
              size={Math.min(size, 22)}
            />
          )
        },
      })}
    >
      <MainTab.Screen name="Hotspots" component={Hotspots} />
      <MainTab.Screen name="More" component={More} />
      <MainTab.Screen
        name="HmDashboard"
        // using hotspots screen instead of HmDashboard screen with a dedicated tab
        // getting google auth functional in an embedded browser is almost
        // impossible due to google policies unless we get google to trust our app
        // as a browser.
        component={Hotspots}
        listeners={{
          tabPress: openDashboardBrowser,
        }}
      />
      <MainTab.Screen name="Support" component={Support} />
    </MainTab.Navigator>
  )
}

export default memo(MainTabs)
