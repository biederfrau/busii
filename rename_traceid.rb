#!/usr/bin/env ruby
# encoding: utf-8

require 'fileutils'

files = Dir["lowerhousing_renamed/logs/production/**/*.yaml"]
files.each do |file|
  id = File.read(file)[/trace:id.*'\d+'/].scan(/\d+/).first

  dir = file.split(File::SEPARATOR)

  if dir.size == 4 then
    new_path = File.join ['lowerhousing', 'production', id + '.xes.yaml']
  elsif dir.size == 5 then
    new_path = File.join ['lowerhousing', 'production', dir[-2], id + '.xes.yaml']
  end

  abort "NOOOOOOOO!" if File.exist? new_path

  puts "#{file} -> #{new_path}"
  FileUtils.cp file, new_path
end
