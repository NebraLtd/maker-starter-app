import React, { memo, useMemo } from 'react'
import { Hotspot } from '@helium/http'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { startCase } from 'lodash'
import CopyIco from '@assets/images/copy.svg'
import ShareHotspotIco from '@assets/images/shareHotspot.svg'
import GlobeIco from '@assets/images/globe.svg'
import TransferIco from '@assets/images/signal.svg'
import AssertLocationIco from '@assets/images/location.svg'
import Clipboard from '@react-native-community/clipboard'
import { Linking, Share } from 'react-native'
import Toast from 'react-native-simple-toast'
import { HeliumActionSheetItemType } from './HotspotActionSheetItem'
import { TouchableOpacityBoxProps } from './TouchableOpacityBox'
import useHaptic from '../utils/useHaptic'
import { EXPLORER_BASE_URL } from '../utils/config'
import { createAppLink } from '../providers/AppLinkProvider'
import HotspotActionSheet from './HotspotActionSheet'
import { RootNavigationProp } from '../navigation/main/tabTypes'

type Props = { item?: Hotspot }
const HotspotMenuSheet = ({ item }: Props) => {
  const { t } = useTranslation()
  const { triggerNotification } = useHaptic()
  const navigation = useNavigation<RootNavigationProp>()
  const explorerUrl = useMemo(() => {
    if (!item) return ''
    const target = 'hotspots'
    return `${EXPLORER_BASE_URL}/${target}/${item.address}`
  }, [item])

  const buttonProps = useMemo(
    () =>
      ({
        width: 40,
        height: 31,
        alignItems: 'center',
        justifyContent: 'center',
      } as TouchableOpacityBoxProps),
    [],
  )
  const actionSheetData = useMemo(() => {
    return [
      {
        label: t('hotspot_details.options.transfer'),
        value: 'transfer',
        Icon: TransferIco,
        action: () => navigation.push('TransferHotspot', { hotspot: item }),
      },
      {
        label: t('hotspot_details.options.assert_location'),
        value: 'assertLocation',
        Icon: AssertLocationIco,
        action: () => navigation.push('HotspotAssert', { hotspot: item }),
      },
      {
        label: t('hotspot_details.options.viewExplorer'),
        value: 'viewExplorer',
        Icon: GlobeIco,
        action: () => Linking.openURL(explorerUrl),
      },
      {
        label: t('hotspot_details.options.share'),
        value: 'share',
        Icon: ShareHotspotIco,
        action: () => {
          if (!item?.address) return

          Share.share({
            message: createAppLink('hotspot', item.address),
          })
        },
      },
      {
        label: `${t('generic.copy')} ${t('generic.hotspot')} ${t(
          'generic.address',
        )}`,
        value: 'copy_hotspot',
        Icon: CopyIco,
        action: () => {
          if (!item?.address) return

          Clipboard.setString(item.address)
          triggerNotification('success')
          const { address } = item
          const truncatedAddress = [
            address.slice(0, 8),
            address.slice(-8),
          ].join('...')
          Toast.show(
            t('wallet.copiedToClipboard', { address: truncatedAddress }),
          )
        },
      },
      {
        label: `${t('generic.copy')} ${t('generic.owner')} ${t(
          'generic.address',
        )}`,
        value: 'copy_owner',
        Icon: CopyIco,
        action: () => {
          if (!item?.owner) return

          Clipboard.setString(item.owner)
          triggerNotification('success')
          const { owner } = item
          const truncatedAddress = [owner.slice(0, 8), owner.slice(-8)].join(
            '...',
          )
          Toast.show(
            t('wallet.copiedToClipboard', { address: truncatedAddress }),
          )
        },
      },
    ] as HeliumActionSheetItemType[]
  }, [explorerUrl, item, t, triggerNotification, navigation])

  return (
    <HotspotActionSheet
      buttonProps={buttonProps}
      iconVariant="kabob"
      iconColor="primary"
      title={startCase(item?.name)}
      data={actionSheetData}
      closeOnSelect={false}
    />
  )
}

export default memo(HotspotMenuSheet)
