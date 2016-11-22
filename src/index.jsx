/** @jsx createElement */
import _ from 'lodash'
import { createElement } from 'elliptical'
import { setClipboard } from 'lacona-api'
import { Command, Time } from 'lacona-phrases'
import tz from 'timezone-names'
import moment from 'moment'

const tzItems = _.chain(tz.getAll())
  .map(info => {
    const value = {
      name: info.Name,
      abbreviation: info.Abbreviation,
      offset: tz.getTimezoneOffsetByName(info.Name).TotalMinutesOffset
    }

    return [{
      text: info.Abbreviation,
      value,
      qualifier: info.Name
    }, {
      text: info.Name,
      value
    }]
  })
  .flatten()
  .value()

const TimeZone = {
  describe () {
    return (
      <placeholder argument='time zone'>
        <list items={tzItems} limit={10} />
      </placeholder>
    )
  }
}

function timezoneMath (result, twentyFourHour) {
  const startMoment = result.time
    ? (result.fromTZ
        ? moment.utc(result.time).subtract(result.fromTZ.offset, 'minutes')
        : moment(result.time).utc()
      )
    : moment().utc()

  // if (result.fromTZ) {
  //   startMoment.subtract(result.fromTZ.offset, 'minutes')
  // } else {
  //   startMoment.add(new Date().getTimezoneOffset(), 'minutes')
  // }

  const toMoment = startMoment.clone()
  toMoment.add(result.toTZ.offset, 'minutes')

  const format = twentyFourHour ? 'HH:mm' : 'h:mm a'
  const toFormat = toMoment.format(format)
  return `${toFormat} ${result.toTZ.abbreviation}`
}

export const ConvertTimezoneCommand = {
  extends: [Command],

  execute (result, {config}) {
    const text = timezoneMath(result, config.output24HourTime)
    setClipboard({text})
  },

  preview (result, {config}) {
    const value = timezoneMath(result, config.output24HourTime)
    return {type: 'text', value}
  },

  describe () {
    return (
      <sequence>
        <list items={['check ', 'compute ', 'calculate ', 'convert ']} />
        <choice id='time'>
          <Time />
          <literal text='current time' />
        </choice>
        <sequence optional limited id='fromTZ'>
          <list items={[' ']} />
          <TimeZone merge />
        </sequence>
        <list items={[' to ', ' in ']} limit={1} />
        <TimeZone id='toTZ' />
      </sequence>
    )
  }
}

export const extensions = [ConvertTimezoneCommand]
