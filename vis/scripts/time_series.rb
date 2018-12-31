#!/usr/bin/env ruby
# encoding: utf-8

require 'json'
require 'fileutils'

require_relative 'busii_utils'

f = ARGV[0]
p = File.basename f, '.xes.yaml'

vacts = extract_and_clean_machine_receives(f).flatten.keep_if { |ev| ev[:name].end_with? 'aaVactB' }.sort_by { |ev| ev[:server_timestamp] }.reduce(Hash.new { |h, k| h[k] = [] }) do |acc, ev|
  axis = ev[:name].split('/')[1]
  acc[axis] << [ev[:server_timestamp].iso8601(3), ev[:value]]

  acc
end

loads = extract_and_clean_machine_receives(f).flatten.keep_if { |ev| ev[:name].end_with? 'aaVactB' }.sort_by { |ev| ev[:server_timestamp] }.reduce(Hash.new { |h, k| h[k] = [] }) do |acc, ev|
  axis = ev[:name].split('/')[1]
  acc[axis] << [ev[:server_timestamp].iso8601(3), ev[:value]]

  acc
end

torques = extract_and_clean_machine_receives(f).flatten.keep_if { |ev| ev[:name].end_with? 'aaTorque' }.sort_by { |ev| ev[:server_timestamp] }.reduce(Hash.new { |h, k| h[k] = [] }) do |acc, ev|
  axis = ev[:name].split('/')[1]
  acc[axis] << [ev[:server_timestamp].iso8601(3), ev[:value]]

  acc
end

h = {
  'aaVactB': vacts,
  'aaLoad': loads,
  'aaTorque': torques
}

FileUtils::mkdir_p File.join('..', 'data', p)
File.write File.join('..', 'data', p, 'timeseries.json'), JSON::generate(h)
