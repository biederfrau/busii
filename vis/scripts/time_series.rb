#!/usr/bin/env ruby
# encoding: utf-8

require 'json'
require 'fileutils'

p = ARGV[0]

vact   = File.join '..', '..', 'processed_data', "aaVactB_#{p}.json"
load_  = File.join '..', '..', 'processed_data', "aaLoad_#{p}.json"
torque = File.join '..', '..', 'processed_data', "aaTorque_#{p}.json"

h = {
  'aaVactB': JSON::parse(File.read(vact)),
  'aaLoad': JSON::parse(File.read(load_)),
  'aaTorque': JSON::parse(File.read(torque))
}

FileUtils::mkdir_p File.join('..', 'data', p)
File.write File.join('..', 'data', p, 'timeseries.json'), JSON::generate(h)
