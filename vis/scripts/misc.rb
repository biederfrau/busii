#!/usr/bin/env ruby
# encoding: utf-8

require 'json'
require 'pp'
require 'fileutils'

require_relative 'busii_utils'

f = ARGV.first
h = {}

events = extract_and_clean_machine_receives(f).flatten
a, b = events[0][:timestamp], events[-1][:timestamp]

idents = events.select { |ev| ev[:name].end_with? 'actToolIdent' }.sort_by { |ev| ev[:timestamp] }
lengths = events.select { |ev| ev[:name].end_with? 'actToolLength1' }.sort_by { |ev| ev[:timestamp] }
radiuses = events.select { |ev| ev[:name].end_with? 'actToolRadius' }.sort_by { |ev| ev[:timestamp] }
feed_rate = events.select { |ev| ev[:name].end_with? 'feedRateOvr' }.sort_by { |ev| ev[:timestamp] }

if idents.size == 1 then
  idents = [[a.iso8601(3), b.iso8601(3), idents[0][:value]]]
else
  idents_ = idents
  idents = idents.each_cons(2).map do |t, u|
    [t[:timestamp].iso8601(3), u[:timestamp].iso8601(3), t[:value]]
  end

  idents.unshift([a.iso8601(3), idents_[0][:timestamp].iso8601(3), idents_[0][:value]])
  idents << [idents_[-1][:timestamp].iso8601(3), b.iso8601(3), idents_[-1][:value]]
end

h = {
  'actToolIdent': idents,
  'actToolLength1': lengths.map { |ev| [ev[:timestamp].iso8601(3), ev[:value]] },
  'actToolRadius': radiuses.map { |ev| [ev[:timestamp].iso8601(3), ev[:value]] },
  'feedRateOvr': feed_rate.map { |ev| [ev[:timestamp].iso8601(3), ev[:value]] }
}

h[:actToolLength1].unshift [a.iso8601(3), h[:actToolLength1][0][1]]
h[:actToolLength1] << [b.iso8601(3), h[:actToolLength1][-1][1]]

h[:actToolRadius].unshift [a.iso8601(3), h[:actToolRadius][0][1]]
h[:actToolRadius] << [b.iso8601(3), h[:actToolRadius][-1][1]]

h[:feedRateOvr].unshift [a.iso8601(3), h[:feedRateOvr][0][1]]
h[:feedRateOvr] << [b.iso8601(3), h[:feedRateOvr][-1][1]]

p = File.basename f, '.xes.yaml'
path = File.join '..', 'data', p
FileUtils.mkdir_p path

File.write File.join(path, 'misc.json'), JSON::generate(h)
