#!/usr/bin/env ruby
# encoding: utf-8

require 'pp'
require_relative 'busii_utils'

file = ARGV.first
position_events = extract_and_clean_machine_receives(file).map do |events|
  events.keep_if { |event| event[:name].end_with?('LeadP') || event[:name].end_with?('actToolIdent') }
end.keep_if { |a| !a.empty? }.flatten.sort_by { |event| event[:server_timestamp] }

first_tool = position_events.find { |event| event[:name].end_with? 'actToolIdent' }[:value] rescue 'none'
cursor = { tool: first_tool }
time = nil
puts 'T,X,Y,Z,TOOL'
position_events.each do |event|
  new_time = event[:server_timestamp]

  if new_time != time then
    print time.iso8601(3) + ',' if cursor.size == 4
    puts cursor.sort_by { |k, _| k == :tool ? 'zzzzzzzzzzzzzzz' : k }.map { |_, v| v }.join ',' if cursor.size == 4
    time = new_time
  end

  if event[:name].end_with? 'actToolIdent' then
    cursor[:tool] = event[:value]
    next
  end

  axis = event[:name].scan(/Axis\/(X|Y|Z)\/aaLeadP$/).first.first rescue nil

  next if axis.nil? # ignore b and c axis because we have no rotation support
  cursor[axis] = event[:value]
end
