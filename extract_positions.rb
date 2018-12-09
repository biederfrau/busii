#!/usr/bin/env ruby
# encoding: utf-8

require 'pp'
require_relative 'busii_utils'

file = ARGV.first
position_events = extract_and_clean_machine_receives(file).map do |events|
  events.keep_if { |event| event[:name].end_with? 'LeadP' }
end.keep_if { |a| !a.empty? }.flatten.sort_by { |event| event[:server_timestamp] }

cursor = {}
time = nil
puts 'T,X,Y,Z'
position_events.each do |event|
  new_time = event[:server_timestamp]

  if new_time != time then
    print time.iso8601(4) + ',' if cursor.size == 3
    puts cursor.sort_by { |k, _| k }.map { |_, v| v }.join ',' if cursor.size == 3
    time = new_time
  end

  axis = event[:name].scan(/Axis\/(X|Y|Z)\/aaLeadP$/).first.first
  cursor[axis] = event[:value]
end
