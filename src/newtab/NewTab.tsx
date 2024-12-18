import { TixClock } from './TixClock/TixClock'
import { FuzzyModal } from './FuzzyModal/FuzzyModal'
import './NewTab.css'

export const NewTab = () => {
  return (
    <>
      <FuzzyModal />
      <TixClock className="tixClock" />
    </>
  )
}

export default NewTab
