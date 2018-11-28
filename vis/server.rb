#!/usr/bin/env ruby
# encoding: utf-8

require 'sinatra'

set :public_dir, './static'

get '/' do
  redirect '/index.html'
end

get '/proc/:id/cluster_coords' do |id|
  content_type :json
  file = File.join 'data', id, 'cluster_coords.json'
  halt 400 unless File.exist? file

  send_file file
end

get '/proc/:id/timeseries' do |id|
  content_type :json
  file = File.join 'data', id, 'timeseries.json'
  halt 400 unless File.exist? file

  send_file file
end

get '/proc/:id/misc' do |id|
  content_type :json
  file = File.join 'data', id, 'misc.json'
  halt 400 unless File.exist? file

  send_file file
end

get '/proc/:id/activities' do |id|
  content_type :json
  file = File.join 'data', id, 'activities.json'
  halt 400 unless File.exist? file

  send_file file
end

put '/proc/:id/classification' do |id|
  # put a classification for a time segment
end
