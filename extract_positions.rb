#!/usr/bin/env ruby
# encoding: utf-8

require 'pp'
require_relative 'busii_utils'

def deg2rad(deg)
  deg.to_f * 3.14 / 180
end

def construct_bc_rotation_matrix(b, c)
  [
    [Math.cos(b),             -Math.cos(b)*Math.sin(c), Math.sin(b), 0],
    [Math.sin(c),              Math.cos(c),             0,           0],
    [-Math.sin(b)*Math.cos(c), Math.sin(b)*Math.sin(c), Math.cos(b), 0],
    [0,                        0,                       0,           1]
  ]
end

def matrix_vector_multiply(matrix, vector)
  matrix.map { |row| row.zip(vector).map { |ei, ej| ei * ej }.reduce(&:+) }
end

file = ARGV.first
position_events = extract_and_clean_machine_receives(file).map do |events|
  events.keep_if { |event| event[:name].end_with? 'LeadP' }
end.keep_if { |a| !a.empty? }.flatten.sort_by { |event| event[:time] }

min_x = position_events.select { |e| e[:name].include? 'X' }.min_by { |e| e[:value] }[:value]
min_y = position_events.select { |e| e[:name].include? 'Y' }.min_by { |e| e[:value] }[:value]
min_z = position_events.select { |e| e[:name].include? 'Z' }.min_by { |e| e[:value] }[:value]

puts "X,Y,Z,F"
cursor = { 'B' => 0, 'C' => 0 }
position_events.each do |event|
  axis = event[:name].scan(/Axis\/(X|Y|Z|B|C)\/aaLeadP$/).first.first
  cursor[axis] = event[:value]

  next if cursor.size != 5

  pos = cursor.select { |k, _| !['B', 'C'].include?(k) }.sort_by { |k, _| k }.map { |_, v| v } + [1]
  v = matrix_vector_multiply construct_bc_rotation_matrix(cursor['B'], cursor['C']), pos
  puts pos.join ','
end
