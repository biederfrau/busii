#!/usr/bin/env ruby
# encoding: utf-8

require_relative 'busii_utils'
require 'pp'

file = ARGV.first

coords = extract_positions_with_timestamp [file]
coords.keys.each { |key| coords[key].sort_by! { |tup| tup.first }.reverse! }

STDOUT.puts "X,Y,Z"
until coords.any? { |_, l| l.empty? } do
  STDOUT.puts "#{coords['X'][-1].last},#{coords['Y'][-1].last},#{coords['Z'][-1].last}"

  # XXX could be smarter here but its already late
  coords['X'].pop
  coords['Y'].pop
  coords['Z'].pop
end
