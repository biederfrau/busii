#!/usr/bin/env ruby
# encoding: utf-8

require 'pp'
require_relative 'busii_utils'

file = ARGV.first
position_events = extract_and_clean_machine_receives(file).map do |events|
  events.keep_if { |event| event[:name].end_with? 'LeadP' }
end.keep_if { |a| !a.empty? }.flatten.sort_by { |event| event[:time] }

puts "X,Y,Z"
cursor = {}
position_events.each do |event|
  axis = event[:name].scan(/Axis\/(X|Y|Z)\/aaLeadP$/).first.first
  cursor[axis] = event[:value]

  puts cursor.sort_by { |k, _| k }.map { |_, v| v }.join ',' if cursor.size == 3
end
