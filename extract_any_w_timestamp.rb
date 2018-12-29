#!/usr/bin/env ruby
# encoding: utf-8

require 'json'

require_relative 'busii_utils'

f = ARGV.first
thing = ARGV[1]

loads = extract_and_clean_machine_receives(f).flatten.keep_if { |ev| ev[:name].end_with? thing }.sort_by { |ev| ev[:server_timestamp] }.reduce(Hash.new { |h, k| h[k] = [] }) do |acc, ev|
  axis = ev[:name].split('/')[1]
  acc[axis] << [ev[:server_timestamp].iso8601(3), ev[:value]]

  acc
end

File.write "processed_data/#{thing}_#{File.basename f, '.xes.yaml'}.json", loads.to_json
