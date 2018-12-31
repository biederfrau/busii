#!/usr/bin/env ruby
# encoding: utf-8

require 'json'
require 'pp'
require 'fileutils'

require_relative 'busii_utils'

f = ARGV.first
h = {}

events = extract_and_clean_machine_receives(f).flatten
a, b = events[0][:server_timestamp], events[-1][:server_timestamp]

idents = events.select { |ev| ev[:name].end_with? 'actToolIdent' }.sort_by { |ev| ev[:server_timestamp] }
lengths = events.select { |ev| ev[:name].end_with? 'actToolLength1' }.sort_by { |ev| ev[:server_timestamp] }
radiuses = events.select { |ev| ev[:name].end_with? 'actToolRadius' }.sort_by { |ev| ev[:server_timestamp] }
feed_rate = events.select { |ev| ev[:name].end_with? 'feedRateOvr' }.sort_by { |ev| ev[:server_timestamp] }

if idents.size == 1 then
  idents = [[a.iso8601(3), b.iso8601(3), idents[0][:value]]]
elsif idents.size > 1 then
  idents_ = idents
  idents = idents.each_cons(2).map do |t, u|
    [t[:server_timestamp].iso8601(3), u[:server_timestamp].iso8601(3), t[:value]]
  end

  idents.unshift([a.iso8601(3), idents_[0][:server_timestamp].iso8601(3), idents_[0][:value]])
  idents << [idents_[-1][:server_timestamp].iso8601(3), b.iso8601(3), idents_[-1][:value]]
end

h = {
  'actToolIdent': idents,
  'actToolLength1': lengths.map { |ev| [ev[:server_timestamp].iso8601(3), ev[:value]] },
  'actToolRadius': radiuses.map { |ev| [ev[:server_timestamp].iso8601(3), ev[:value]] },
  'feedRateOvr': feed_rate.map { |ev| [ev[:server_timestamp].iso8601(3), ev[:value]] }
}

if lengths.size > 1 then
  h[:actToolLength1].unshift [a.iso8601(3), h[:actToolLength1][0][1]]
  h[:actToolLength1] << [b.iso8601(3), h[:actToolLength1][-1][1]]
end

if radiuses.size > 1 then
  h[:actToolRadius].unshift [a.iso8601(3), h[:actToolRadius][0][1]]
  h[:actToolRadius] << [b.iso8601(3), h[:actToolRadius][-1][1]]
end

if feed_rate.size > 1 then
  h[:feedRateOvr].unshift [a.iso8601(3), h[:feedRateOvr][0][1]]
  h[:feedRateOvr] << [b.iso8601(3), h[:feedRateOvr][-1][1]]
end

p = File.basename f, '.xes.yaml'
path = File.join '..', 'data', p
FileUtils.mkdir_p path

File.write File.join(path, 'misc.json'), JSON::generate(h)
