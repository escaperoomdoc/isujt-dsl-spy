{"success":true,"name":"etk1","totalCount":0,"data":"Module.create :AjaxMAP do\n\tdescription \"модуль формирования ответов на запросы тонкого клиента\"\n\tbelongs_to :ИСУЖТ\n\tmethods :service => %q{\n# $TfsSource: 'MAP_001/25_AjaxMAP__self_service.rb' - 2019-07-31 14:05:52 $\n    def self.service(request, response)\n      response.setContentType('application/json')\n      response.setCharacterEncoding('utf-8')\n      method = request.getParameter('method')\n      params_hash = {}\n      request.getParameterMap.each_pair { |param, param_arr| params_hash[param] = param_arr.first }\n      params_hash['user'] = $space.userAccount.get(request.getUserPrincipal.toString)\n      params_hash['page'] = 1 unless params_hash.has_key?('page')\n      params_hash['limit'] = 50 unless params_hash.has_key?('limit')\n      params_hash['load'] = \"false\" unless params_hash.has_key?('load')\n      params_hash['port'] = request.getServerPort\n      io = params_hash[:io] = response.outputStream.to_io\n      begin\n        io.write '{'\n        data = self.send method.to_sym, params_hash\n        if data\n          io.write \"\\\"success\\\":true,\\\"totalCount\\\":#{data[1].to_i},\"\n          io.write \"\\\"data\\\":#{data[0] ? data[0].to_json : []},\"\n          io.write \"\\\"settings\\\":#{data[2] ? data[2].to_json : 'null'},\"\n          io.write \"\\\"type\\\":#{data[3] ? (?\"+ data[3] + ?\") : 'null'},\"\n          io.write \"\\\"model_name\\\":#{data[4] ? (?\"+ data[4] + ?\") : 'null'}\"\n        end\n      rescue Exception => ex\n        io.write \"\\\"success\\\":false,\\\"message\\\":\\\"unable to perform request: #{ex}\\\",\\\"trace\\\":#{ex.backtrace}\\\"\"\n      ensure\n        io.write '}'\n        io.close\n      end\n    end\n},\n\t\t:cud_КоординатыСтанцииs => %q{\n# $TfsSource: 'MAP_001/09_AjaxMAP__self_cud_КоординатыСтанцииs.rb' - 2019-07-31 14:05:52 $\n    def self.cud_КоординатыСтанцииs(params = Hash.new)\n      if params[:io]\n        io = params[:io]\n      else\n        raise \"No IO\"\n      end\n      if params[\"operation\"]\n        operation = params[\"operation\"]\n      else\n        raise \"No operation\"\n      end\n      raise \"Invalid operation: #{operation}, expected: create or update or delete or info\" unless [\"create\", \"update\", \"delete\", \"info\"].member? operation.downcase\n      if params[\"data\"]\n        data = JSON.parse(params[\"data\"])\n      else\n        data = []\n      end\n      case operation\n      when \"create\"\n        raise \"No data\" if data.empty?\n        count = 0\n        data.each do |item|\n          count += 1 if User::OntM_StationCoordinates.create(item.inject({}){|memo,(k,v)| memo[k.to_sym] = v; memo})\n        end\n        io.write \"\\\"created\\\":#{count}\"\n      when \"update\"\n        raise \"No data\" if data.empty?\n        count, data_hs, ids = 0, {}, []\n        data.each do |item|\n          id = item[\"id\"].to_i\n          item.delete \"id\"\n          data_hs[id] = item\n          ids << id\n        end\n        User::Storage.each_object(\"КоординатыСтанций\") do |obj_id, obj|\n          next unless ids.member? obj_id\n          item = data_hs[obj_id]\n          item.keys.each { |key| obj.send(:\"set_#{key}\", item[key]) }\n          count += 1\n        end\n        io.write \"\\\"updated\\\":#{count}\"\n      when \"delete\"\n        raise \"No data\" if data.empty?\n        count = 0\n        data.each do |item|\n          count += 1 if UserObject.del_object_by_id(item[\"obj\"].to_i)\n        end\n        io.write \"\\\"deleted\\\":#{count}\"\n      when \"info\"\n        io.write \"\\\"attributes\\\":[\"\n        io.write \"{\\\"id_isuzt\\\":\\\"Numeric\\\"}\"\n        io.write \",{\\\"latitude_gis\\\":\\\"Numeric\\\"}\"\n        io.write \",{\\\"longitude_gis\\\":\\\"Numeric\\\"}\"\n        io.write \",{\\\"latitude_ont\\\":\\\"Numeric\\\"}\"\n        io.write \",{\\\"longitude_ont\\\":\\\"Numeric\\\"}\"\n        io.write \",{\\\"latitude_geo\\\":\\\"Numeric\\\"}\"\n        io.write \",{\\\"longitude_geo\\\":\\\"Numeric\\\"}\"\n        io.write \"]\"\n      end\n      return nil\n    rescue => ex\n      method = (self.to_s + \".\" + __method__.to_utf.to_s).gsub(/User::/,'')\n      User::err \" ISUZT :: Ошибка в методе #{method}. #{ex}\\n. #{(ex.respond_to?(:cause) ? ex.cause : \"-\")}\\n. #{ex.backtrace}\\n\"\n      raise ex\n    end\n},\n\t\t:_self_get_centralization => %q{\n# $TfsSource: 'MAP_001/10_AjaxMAP__self_get_centralization.rb' - 2019-09-30 17:07:22 $\n    def self.get_centralization(params = Hash.new)\n      # task  [ISUZTONTOL-185]\n      # http://localhost:8080/ajax.php?module=MAP&method=get_centralization\n      rez = []\n      latitudes  = 0.0\n      longitudes = 0.0\n      count      = 0\n      \n      station_id = if params[\"station\"] != \"\"\n        params[\"station\"].to_i\n      elsif params[\"depo\"] != \"\"\n        User::info params[\"depo\"].inspect\n        User::info params[\"road\"].inspect\n        station_hash = self.get_list_depo({\"road\" => params[\"road\"], \"cnsi\" => params[\"depo\"]})[0]\n        if station_hash\n          User::info station_hash\n          obj = User::UserObject.get(station_hash[0][:station].to_i)\n          station_hash[0][:station].to_i\n        end\n      else\n        nil \n      end\n      \n      User::UserClass.get(:ОнтК_КоординатыСтанции).objects.values.each do |st|      \n        if station_id\n          next if station_id != st.id_isuzt\n        elsif params[\"road\"] != \"\"\n          station = User::UserObject.get(st.id_isuzt)\n          next unless station\n          dor = station.получить_дорогу_принадлежности\n          next unless dor\n          next if dor.get_telegraphCode.to_i != params[\"road\"].to_i\n        end\n        latitudes  += st.latitude_gis\n        longitudes += st.longitude_gis\n        count      += 1\n        break if station_id\n      end\n      \n      return [(latitudes/count.to_f), (longitudes/count.to_f)], 1 if latitudes != 0.0\n      return rez, rez.size\n    rescue => ex\n      method = (self.to_s + \".\" + __method__.to_utf.to_s).gsub(/User::/,'')\n      User::err \" AjaxMAP :: Ошибка в методе #{method}. #{ex}\\n. #{(ex.respond_to?(:cause) ? ex.cause : \"-\")}\\n. #{ex.backtrace}\\n\"\n      raise ex\n    end\n},\n\t\t:_self_get_data_layers => %q{    def self.get_data_layers( params = Hash.new )\n      # self-method для выдачи списка слоев\n      # @return [Array], [Number]\n      # @author Вернер Д.А.\n      # @date 26.04.2019\n      # @source $TfsSource: 'MAP_001/11_AjaxMAP__self_get_data_layers.rb' - 2019-09-16 15:57:26 $\n      # @needs [ISUZTONTOL-215]\n      # http://localhost:8080/ajax.php?module=MAP&method=get_data_layers&layer=layer_stations0\n\n      rezult    = \"\"\n      verify_mass = [\"layer\"]\n      raise \"Не хватает аргументов\" unless (verify_mass & params.keys).size == verify_mass.size\n      require 'iconv'\n      converter = Iconv.new(\"utf-8\", \"utf-8\")\n\n      if [\"layer_stations5\",\"layer_stations4\",\"layer_stations3\",\"layer_stations2\",\"layer_stations1\",\"layer_stations0\"].include?(params[\"layer\"].to_s)\n        #Станции\n        rezult << User::OntM_StationCoordinates.get_station_json(params[\"layer\"].to_s.gsub(\"layer_stations\", \"\").to_i)\n      elsif \"layer_stations\" == params[\"layer\"].to_s #Станции все\n        rezult << User::OntM_StationCoordinates.get_station_json\n      elsif \"layer_uol\" == params[\"layer\"].to_s #Локомотивные участки\n        rezult << User::OntM_StationCoordinates.get_data_uol_json\n      elsif \"layer_depo\" == params[\"layer\"].to_s #Депо\n        rezult << User::OntM_StationCoordinates.get_data_depo_json\n      elsif \"layer_depo_tche\" == params[\"layer\"].to_s #Депо тчэ\n        rezult << User::OntM_StationCoordinates.get_data_depo_json({\"name\" => \"тчэ-\"})\n      elsif \"layer_depo_td\" == params[\"layer\"].to_s #Депо тд\n        rezult << User::OntM_StationCoordinates.get_data_depo_json({\"name\" => \"тд-\"})\n      elsif \"layer_depo_tdr\" == params[\"layer\"].to_s #Депо тдр\n        rezult << User::OntM_StationCoordinates.get_data_depo_json({\"name\" => \"тдр-\"})\n      elsif \"layer_depo_tch\" == params[\"layer\"].to_s #Депо тч\n        rezult << User::OntM_StationCoordinates.get_data_depo_json({\"name\" => \"тч-\"})\n      elsif \"layer_depo_tchp\" == params[\"layer\"].to_s #Депо тчп\n        rezult << User::OntM_StationCoordinates.get_data_depo_json({\"name\" => \"тчп-\"})\n      elsif \"layer_areas\" == params[\"layer\"].to_s #Дорога\n        rezult << User::OntM_ObjectsCoordinates.get_data_areas_json\n      elsif \"layer_runs\" == params[\"layer\"].to_s #Перегоны\n        rezult << User::OntM_ObjectsCoordinates.get_data_runs_json\n        #File.open('./web/resources/OpenLayers/layers/railway_runs.txt').each_with_index do |row, number_line|\n        #  rezult << converter.iconv(row)\n        #end\n      elsif \"layer_objects\" == params[\"layer\"].to_s #объекты\n        File.open('./web/resources/OpenLayers/layers/objects.txt').each_with_index do |row, number_line|\n          rezult << converter.iconv(row)\n        end\n      else\n        raise \"Неизвестный слой\"\n      end\n\n      return [JSON.parse(rezult)], 1\n    rescue => ex\n      method = (self.to_s + \".\" + __method__.to_utf.to_s).gsub(/User::/,'')\n      User::err(\" AjaxMAP :: Ошибка в методе #{method}. #{ex}\\n. #{(ex.respond_to?(:cause) ? ex.cause : \"-\")}\\n. #{ex.backtrace*\"\\n\"}\")\n      return [{\"result\" => \"ERROR\", \"message\" => \"#{ex}\"}, 2]\n    end\n},\n\t\t:_self_get_list_centralization => %q{\n# $TfsSource: 'MAP_001/12_AjaxMAP__self_get_list_centralization,.rb' - 2019-07-31 14:05:52 $\n    def self.get_list_centralization(params = Hash.new)\n      # task  [ISUZTONTOL-185]\n      # http://localhost:8080/ajax.php?module=MAP&method=get_list_centralization\n      rez = []\n      rez << { :id => 2500,   :name => \"Дирекция\"}\n      rez << { :id => 156.25, :name => \"Депо\"}\n      rez << { :id => 78.125, :name => \"Станции\"}\n      \n      return rez, rez.size\n    rescue => ex\n      method = (self.to_s + \".\" + __method__.to_utf.to_s).gsub(/User::/,'')\n      User::err \" AjaxMAP :: Ошибка в методе #{method}. #{ex}\\n. #{(ex.respond_to?(:cause) ? ex.cause : \"-\")}\\n. #{ex.backtrace}\\n\"\n      raise ex\n    end\n},\n\t\t:_self_get_list_depo => %q{\n# $TfsSource: 'MAP_001/13_AjaxMAP__self_get_list_depo.rb' - 2019-09-16 15:57:26 $\n    def self.get_list_depo(params = Hash.new)\n      # task  [ISUZTONTOL-185]\n      # http://localhost:8080/ajax.php?module=MAP&method=get_list_depo\n      \n      polygon  = User::РешающийПолигон.найти( 'имя', User::ОписаниеКомплекса.имя_решающего_полигона )\n\n      roads = params[\"road\"].to_s != \"\" ? [params[\"road\"].to_i] : polygon.получить_дороги.map{|el| el.получить_телеграфный_код.to_i}\n      \n      rez = []\n      User::Storage.get('ЭксплуатационныеЛокомотивныеДепо').objects.each do |obj_id, obj|\n        road = obj.parentEnterprise\n        next if obj.получить_ЦНСИ.nil? || road.nil? || !roads.include?(road.получить_телеграфный_код.to_i)\n        next if params[\"cnsi\"] and params[\"cnsi\"].to_i != obj.получить_ЦНСИ.to_i\n        next if !obj.получить_краткое_имя.utf_downcase.include?('тчэ')\n        rez << { :id => obj.получить_ЦНСИ.to_i, :name => obj.short_name2, :station => obj.relatedStation ? obj.relatedStation.obj_id : nil, :asoup => obj.источник[\"АСОУП\"].to_i}\n      end\n\n      return rez.sort{|x,y| x[:asoup] <=> y[:asoup]}, rez.size\n    rescue => ex\n      method = (self.to_s + \".\" + __method__.to_utf.to_s).gsub(/User::/,'')\n      User::err \" AjaxMAP :: Ошибка в методе #{method}. #{ex}\\n. #{(ex.respond_to?(:cause) ? ex.cause : \"-\")}\\n. #{ex.backtrace}\\n\"\n      raise ex\n    end\n},\n\t\t:_self_get_list_road => %q{    def self.get_list_road( params = Hash.new )\n      # self-method для выдачи списка слоев\n      # @return [Array], [Number]\n      # @author Вернер Д.А.\n      # @date 27.05.2019\n      # @source $TfsSource: 'MAP_001/14_AjaxMAP__self_get_list_road.rb' - 2019-08-12 14:41:38 $\n      # @needs [ISUZTONTOL-241]\n      # http://localhost:8080/ajax.php?module=MAP&method=get_list_road\n\n      rez = []\n      polygon  = User::РешающийПолигон.найти( 'имя', User::ОписаниеКомплекса.имя_решающего_полигона )\n\n      polygon.получить_дороги.each do |obj|\n        rez << { :id => obj.get_telegraphCode.to_i, :name => \"[#{obj.get_telegraphCode.to_s.rjust(2,'0')}] #{obj.name}\" }\n      end\n\n      sort_dir   = \"ASC\"\n      sort_order = \"name\"\n      rez.sort_by! { |s| s[:\"#{sort_order}\"].to_s.utf_upcase.gsub(\"Ё\",\"Ея\").gsub(/^[ ,\"]*/, \"\") }\n\n      return rez, rez.size\n    rescue => ex\n      method = (self.to_s + \".\" + __method__.to_utf.to_s).gsub(/User::/,'')\n      User::err(\" AjaxMAP :: Ошибка в методе #{method}. #{ex}\\n. #{(ex.respond_to?(:cause) ? ex.cause : \"-\")}\\n. #{ex.backtrace*\"\\n\"}\")\n      return [{\"result\" => \"ERROR\", \"message\" => \"#{ex}\"}, 2]\n    end\n},\n\t\t:_self_get_list_station => %q{    def self.get_list_station(params = Hash.new)\n      # self-method для выборка списка станциий\n      # @raise [ArgumentError] если не хватает аргументов\n      # @params Hash\n      #  {\n      #    \"road\"       - название/код дороги\n      #    \"depo\"       - депо \"получить_ЦНСИ\"\n      #    \"name\"      -  часть названия станции\n      #  }\n      # @return [nil]\n      # @author Вернер Д.А.\n      # @date 23.05.2018\n      # @source $TfsSource: 'MAP_001/15_AjaxMAP__self_get_list_station.rb' - 2019-07-31 14:05:52 $\n      # @needs [FrontEnd]\n      # @tasks []\n      #\n      #http://localhost:8080/ajax.php?module=MAP&method=get_list_station\n      #http://localhost:8080/ajax.php?module=MAP&method=get_list_station&road=2000035046\n      \n      road    = params[\"road\"]\n      rezult  = []\n      arr_st  = if params[\"depo\"]\n        station_hash = self.get_list_depo({\"road\" => params[\"road\"], \"cnsi\" => params[\"depo\"].to_i})[0]\n        arr_st = []\n        if station_hash\n          obj = User::UserObject.get(station_hash[0][:station].to_i)\n          #rezult << { :id => station_hash[0][:station].to_i, :name => \"#{obj.get_codeEsr.to_i}-#{obj.name}\" } if obj\n          arr_st << station_hash[0][:station].to_i\n        end\n        arr_st\n      elsif params[\"uol\"]\n        station_hash = self.get_list_uol({\"road\" => params[\"road\"], \"uol\" => params[\"uol\"].to_i})[0]\n        arr_st = []\n        if station_hash\n          obj = station_hash[0][:station]\n          arr_st = obj\n        end\n        arr_st\n      else\n        nil\n      end\n      \n      User::UserClass.get(:ОнтК_КоординатыСтанции).objects.values.each do |obj|\n        st = User::UserObject.get(obj.id_isuzt)\n        next if st.nil?\n        next if arr_st && !arr_st.include?(st.obj_id)\n        next if params[\"road\"] && (st.получить_дорогу_принадлежности.nil? || st.получить_дорогу_принадлежности.get_telegraphCode.to_i != road.to_i)\n        next if params[\"name\"] && (!st.name.include?(params[\"name\"]))\n        rezult << { :id => st.obj_id, :name => \"#{st.get_codeEsr6.to_i}-#{st.name}\" }\n      end\n\n      return rezult.sort_by! { |s| s[:name].utf_upcase.gsub(\"Ё\",\"Ея\").gsub(/^[ ,\"]*/, \"\") }, rezult.size\n      \n    rescue Exception => err\n      method = (self.to_s + \".\" + __method__.to_utf.to_s).gsub(/User::/,'')\n      LogUtil.logger.error \" Ошибка в методе #{method} #{err}\"\n      return   [{\"result\" => \"ERROR\", \"message\" => \"#{err}\"}, 2]\n    end\n},\n\t\t:_self_get_list_uol => %q{\n# $TfsSource: 'MAP_001/16_AjaxMAP__self_get_list_uol.rb' - 2019-08-13 14:33:28 $\n    def self.get_list_uol(params = Hash.new)\n      # task  [ISUZTONTOL-185]\n      # http://localhost:8080/ajax.php?module=MAP&method=get_list_uol\n      \n      p_road = (params[\"road\"] && params[\"road\"].to_i > 0) ? params[\"road\"].to_i : nil\n      p_depo = (params[\"depo\"] && params[\"depo\"].to_i > 0) ? params[\"depo\"].to_i : nil\n      p_station = nil\n      User::Storage.get('ЭксплуатационныеЛокомотивныеДепо').objects.each do |obj_id, obj|\n        p_station = obj.получить_станцию.получить_ЦНСИ.to_i if p_depo == obj.получить_ЦНСИ.to_i\n      end if p_depo\n\n      coor_hash = {}\n      User::UserClass.get(:ОнтК_КоординатыСтанции).objects.values.each do |st|\n        station = User::UserObject.get(st.id_isuzt)\n        coor_hash[station.obj_id] = [st.latitude_gis, st.longitude_gis]\n      end\n      \n      rez = []\n      #User::UserClass.get(:ОнтК_ТяговоеПлечо).objects.each do |loco_id, loco|\n      User::Storage.get('УчасткиОбкаткиОбращенияЛокомотивныхБригад').objects.each do |obj_id, obj|\n        station_arr = []\n        station_arr_cnsi = []\n        #next if params[\"uol\"] && params[\"uol\"].to_i != loco_id\n\n        next unless obj.get_traction_form\n        next unless ( obj.road && p_road == obj.road.получить_телеграфный_код.to_i )\n\n        obj.имя.split(\" — \").each do |st|\n          station = User::Станция.найти(\"имя\", st)\n          if station.nil? || coor_hash[station.obj_id].nil?\n            break\n          end\n\n          station_arr       << station.obj_id\n          station_arr_cnsi  << station.получить_ЦНСИ.to_i\n        end\n\n        next unless ( p_station && station_arr_cnsi.include?(p_station) )\n\n        rez << { :id => obj.obj_id, :name => \"#{obj.имя} (#{obj.length.to_i})\", :station => station_arr}\n      end\n      \n      return rez.sort{|x,y| x[:name] <=> y[:name]}, rez.size\n    rescue => ex\n      method = (self.to_s + \".\" + __method__.to_utf.to_s).gsub(/User::/,'')\n      User::err \" AjaxMAP :: Ошибка в методе #{method}. #{ex}\\n. #{(ex.respond_to?(:cause) ? ex.cause : \"-\")}\\n. #{ex.backtrace}\\n\"\n      raise ex\n    end\n},\n\t\t:_self_get_map_layers => %q{    def self.get_map_layers( params = Hash.new )\n      # self-method для выдачи списка слоев\n      # @return [Array], [Number]\n      # @author Вернер Д.А.\n      # @date 26.04.2019\n      # @source $TfsSource: 'MAP_001/17_AjaxMAP__self_get_map_layers.rb' - 2019-09-30 17:07:22 $\n      # @needs [ISUZTONTOL-215]\n      # http://localhost:8080/ajax.php?module=MAP&method=get_map_layers\n\n      rezult    = []\n      arr_not_checke = [:layer_depo_td, :layer_depo_tdr, :layer_depo_tch, :layer_depo_tchp] #массив не активных слоев\n      (User::Domain.get(:MAP_Layer).data_holder)[:list_values].each do |key, value|\n        next if value.to_s == \"\"\n        rezult << {:id => key, :name => value, :checked => !(arr_not_checke.include?(key)) }\n      end\n\n      return rezult, rezult.size\n    rescue => ex\n      method = (self.to_s + \".\" + __method__.to_utf.to_s).gsub(/User::/,'')\n      User::err(\" AjaxMAP :: Ошибка в методе #{method}. #{ex}\\n. #{(ex.respond_to?(:cause) ? ex.cause : \"-\")}\\n. #{ex.backtrace*\"\\n\"}\")\n      return [{\"result\" => \"ERROR\", \"message\" => \"#{ex}\"}, 2]\n    end\n},\n\t\t:_self_get_map_uth_registered_park => %q{    def self.get_map_uth_registered_park(params = Hash.new)\n      # self-method для выдачи данных из модели MAP_UTH_Registered_Park\n      # # @raise [ArgumentError] если не найдена модель\n      # # @return [nil]\n      # # @author Вернер Д.А.\n      # @date \n      # # @source $TfsSource: 'MAP_001/18_AjaxMAP__self_get_map_uth_registered_park.rb' - 2019-07-31 14:05:52 $\n      # @needs [FrontEnd]\n      # @tasks []\n      \n      result      = []\n      sorted      = []\n      model_name  = :MAP_UTH_Registered_Park \n      model_descr = User::Model.get model_name\n      raise \"Отсутствует модель #{model_name}\" unless model_descr \n\t\t\tmodel_params = \t{\n                        :load\t\t\t\t\t\t\t => false,                                              \n                        :depo              => params[\"depo\"]\n                      }\n\n      row_hash = User::Service.get_models_column model_name, model_params\n      row_hash[:type_power_id][:visible] = false\t\n      \n      if params[\"load\"].to_s == \"true\" # вернуть данные таблицы   \n\t\t\t\tmodel_params[:load] \t\t\t= true\n\t\t\t\tmodel = model_descr.instantiate model_params\n        model.populate\n\n        range = ( 0 ... model.objects.size )\n        for i in range\n          hs = {}\n          row_hash.each_key do |key|\n            hs[key] = model.getValueAt(i, row_hash[key][:column]).to_s\n          end\n          sorted << hs\n        end\n\n        start  = ( params[\"page\"].to_i - 1 ) * params[\"limit\"].to_i\n        ending = start + params[\"limit\"].to_i - model.objects.size < 0 ? start + params[\"limit\"].to_i : model.objects.size\n\n        range = (params[\"page\"] and params[\"limit\"]) ? ( start ... ending ) : ( 0 ... model.objects.size )\n\n        for i in range\n          result << sorted[i]\n        end\n      \n\t\t\t\treturn result, model.objects.size, nil, nil, model_name\n      end\n\n      if params[\"load\"].to_s == \"false\" #вернуть заголовки таблицы\n        return nil, nil, row_hash, nil, model_name        \n      end\n\n    ensure\n      model.stop if model\n    end\n},\n\t\t:_self_get_map_uth_registered_park_del => %q{    def self.get_map_uth_registered_park_del(params = Hash.new)\n      # self-method для выдачи данных из модели MAP_UTH_Registered_Park_del\n      # # @raise [ArgumentError] если не найдена модель\n      # # @return [nil]\n      # # @author Вернер Д.А.\n      # @date \n      # # @source $TfsSource: 'MAP_001/19_AjaxMAP__self_get_map_uth_registered_park_del.rb' - 2019-07-31 14:05:52 $\n      # @needs [FrontEnd]\n      # @tasks []\n      \n      result      = []\n      sorted      = []\n      model_name  = :MAP_UTH_Registered_Park_del \n      model_descr = User::Model.get model_name\n      raise \"Отсутствует модель #{model_name}\" unless model_descr \n\t\t\tmodel_params = \t{\n                        :load\t\t\t\t\t\t\t => false,                                              \n                        :depo              => params[\"depo\"],\n                        :type_power        => params[\"type_power\"],\n                      }\n\n      row_hash = User::Service.get_models_column model_name, model_params\n      row_hash[:title_del][:visible] = false\n      \n      if params[\"load\"].to_s == \"true\" # вернуть данные таблицы   \n\t\t\t\tmodel_params[:load] \t\t\t= true\n\t\t\t\tmodel = model_descr.instantiate model_params\n        model.populate\n\n        range = ( 0 ... model.objects.size )\n        for i in range\n          hs = {}\n          row_hash.each_key do |key|\n            hs[key] = model.getValueAt(i, row_hash[key][:column]).to_s\n          end\n          sorted << hs\n        end\n\n        start  = ( params[\"page\"].to_i - 1 ) * params[\"limit\"].to_i\n        ending = start + params[\"limit\"].to_i - model.objects.size < 0 ? start + params[\"limit\"].to_i : model.objects.size\n\n        range = (params[\"page\"] and params[\"limit\"]) ? ( start ... ending ) : ( 0 ... model.objects.size )\n\n        for i in range\n          result << sorted[i]\n        end\n      \n\t\t\t\treturn result, model.objects.size, nil, nil, model_name\n      end\n\n      if params[\"load\"].to_s == \"false\" #вернуть заголовки таблицы\n        return nil, nil, row_hash, nil, model_name        \n      end\n\n    ensure\n      model.stop if model\n    end\n},\n\t\t:_self_get_map_uth_registered_park_del_del => %q{    def self.get_map_uth_registered_park_del_del(params = Hash.new)\n      # self-method для выдачи данных из модели MAP_UTH_Registered_Park_del_del\n      # # @raise [ArgumentError] если не найдена модель\n      # # @return [nil]\n      # # @author Вернер Д.А.\n      # @date \n      # # @source $TfsSource: 'MAP_001/20_AjaxMAP__self_get_map_uth_registered_park_del_del.rb' - 2019-07-31 14:05:52 $\n      # @needs [FrontEnd]\n      # @tasks []\n      \n      result      = []\n      sorted      = []\n      model_name  = :MAP_UTH_Registered_Park_del_del \n      model_descr = User::Model.get model_name\n      raise \"Отсутствует модель #{model_name}\" unless model_descr \n\t\t\tmodel_params = \t{\n                        :load\t\t\t\t\t\t\t => false,                                              \n                        :loco              => params[\"loco\"],\n                        :section           => params[\"section\"],\n                      }\n\n      row_hash = User::Service.get_models_column model_name, model_params\n      \n      if params[\"load\"].to_s == \"true\" # вернуть данные таблицы   \n\t\t\t\tmodel_params[:load] \t\t\t= true\n\t\t\t\tmodel = model_descr.instantiate model_params\n        model.populate\n\n        range = ( 0 ... model.objects.size )\n        for i in range\n          hs = {}\n          row_hash.each_key do |key|\n            hs[key] = model.getValueAt(i, row_hash[key][:column]).to_s\n          end\n          sorted << hs\n        end\n\n        start  = ( params[\"page\"].to_i - 1 ) * params[\"limit\"].to_i\n        ending = start + params[\"limit\"].to_i - model.objects.size < 0 ? start + params[\"limit\"].to_i : model.objects.size\n\n        range = (params[\"page\"] and params[\"limit\"]) ? ( start ... ending ) : ( 0 ... model.objects.size )\n\n        for i in range\n          result << sorted[i]\n        end\n      \n\t\t\t\treturn result, model.objects.size, nil, nil, model_name\n      end\n\n      if params[\"load\"].to_s == \"false\" #вернуть заголовки таблицы\n        return nil, nil, row_hash, nil, model_name        \n      end\n\n    ensure\n      model.stop if model\n    end\n},\n\t\t:_self_get_map_uth_serviceareasdepo => %q{    def self.get_map_uth_serviceareasdepo(params = Hash.new)\n      # self-method для выдачи данных из модели MAP_UTH_ServiceAreasDepo\n      # # @raise [ArgumentError] если не найдена модель\n      # # @return [nil]\n      # # @author Вернер Д.А.\n      # @date \n      # # @source $TfsSource: 'MAP_001/21_AjaxMAP__self_get_map_uth_serviceareasdepo.rb' - 2019-07-31 14:05:52 $\n      # @needs [FrontEnd]\n      # @tasks []\n      \n      result      = []\n      sorted      = []\n      model_name  = :MAP_UTH_ServiceAreasDepo \n      model_descr = User::Model.get model_name\n      raise \"Отсутствует модель #{model_name}\" unless model_descr \n\t\t\tmodel_params = \t{\n                        :load         => false,                                              \n                        :depo         => params[\"depo\"]\n                      }\n\n      row_hash = User::Service.get_models_column model_name, model_params\n      row_hash[:depo_id][:visible] = false\n      row_hash[:depo][:visible] = false\n      \n      if params[\"load\"].to_s == \"true\" # вернуть данные таблицы   \n\t\t\t\tmodel_params[:load] \t\t\t= true\n\t\t\t\tmodel = model_descr.instantiate model_params\n        model.populate\n\n        range = ( 0 ... model.objects.size )\n        for i in range\n          hs = {}\n          row_hash.each_key do |key|\n            hs[key] = model.getValueAt(i, row_hash[key][:column]).to_s\n          end\n          sorted << hs\n        end\n\n        start  = ( params[\"page\"].to_i - 1 ) * params[\"limit\"].to_i\n        ending = start + params[\"limit\"].to_i - model.objects.size < 0 ? start + params[\"limit\"].to_i : model.objects.size\n\n        range = (params[\"page\"] and params[\"limit\"]) ? ( start ... ending ) : ( 0 ... model.objects.size )\n\n        for i in range\n          result << sorted[i]\n        end\n      \n\t\t\t\treturn result, model.objects.size, nil, nil, model_name\n      end\n\n      if params[\"load\"].to_s == \"false\" #вернуть заголовки таблицы\n        return nil, nil, row_hash, nil, model_name        \n      end\n\n    ensure\n      model.stop if model\n    end\n},\n\t\t:_self_get_norm_loco => %q{# $TfsSource: 'MAP_001/22_AjaxMAP__self_get_norm_loco.rb' - 2019-07-31 14:05:52 $ \n    def self.get_norm_loco(params = Hash.new)\n      # # @raise [ArgumentError] если не найдена модель\n      # # @return [nil]\n      # # @author Вернер Д.А.\n      # @needs [FrontEnd]\n      # @tasks []\n      \n      result = []\n      model_name = case params[\"model\"]\n        when \"rec_in_depot\"\n          :MAP_UTH_Loco_rec_in_depot\n        when \"del_in_depot\"\n          :MAP_UTH_Loco_del_in_depot\n        when \"rec_in_station\"\n          :MAP_UTH_Loco_rec_in_station\n        when \"del_in_station\"\n          :MAP_UTH_Loco_del_in_station\n        else\n          nil\n        end\n        \n      raise \"Отсутствует параметр model во входном хэше\" if model_name.nil?\n      model_descr = User::Model.get model_name\n      raise \"Отсутствует модель #{model_name}\" unless model_descr \n      \n      sub_hash = (User::Domain.get(:SA_Functional_Subsystems).data_holder)[:list_values]\n      \n      model_params = {}  \t    \n      model_params[:depo] = params[\"depo\"].to_i  if params[\"depo\"].to_s != \"\"\n      \n      row_hash = User::Service.get_models_column model_name, model_params\n      \n      model = model_descr.instantiate model_params\n      if params[\"load\"] == \"true\"\n        model.populate\n        \n        model.objects.each_with_index do |obj, i|\n          hs = {}\n          row_hash.each_with_index do |key, num|\n            hs[key.first] = model.getValueAt(i, num).text\n          end\n          result << hs\n        end\n        \n        sort_dir   = \"ASC\"\n        sort_order = \"name\"   \n        \n        if params[\"sort\"]\n          arr_params = JSON.parse(params[\"sort\"])\n          sort_dir   = arr_params[0][\"direction\"]\n          sort_order = arr_params[0][\"property\"] \n        end\n        \n        result.sort_by! { |s| s[:\"#{sort_order}\"].utf_upcase.gsub(\"Ё\",\"Ея\").gsub(/^[ ,\"]*/, \"\") }\n        result.reverse! if \"DESC\" == sort_dir\n        \n        return result, model.objects.size, nil, nil, model_name\n      else\n        return nil, nil, row_hash, nil, model_name\n      end\n\n    ensure\n      model.stop if model\n    end\n},\n\t\t:_self_get_paint_depo => %q{\n# $TfsSource: 'MAP_001/23_AjaxMAP__self_get_paint_depo.rb' - 2019-09-16 15:57:26 $\n    def self.get_paint_depo(params = Hash.new)\n      # task  [ISUZTONTOL-241]\n      # Описание метод, для получения цвета для Депо\n      #   green - \"Электрическая тяга на переменном токе\"\n      #   red   - \"Электрическая тяга на постоянном токе\"\n      #   blue  - \"Тепловозная тяга\"\n      # http://localhost:8080/ajax.php?module=MAP&method=get_paint_depo\n      \n      type_ent = User::ТипПредприятия.найти_по_имени(\"Эксплуатационное депо\")\n      raise \" Отсутствует ТипПредприятия \\\"Эксплуатационное депо\\\" \" if type_ent.nil?\n      type_ent_id = type_ent.obj_id\n      \n      color_type_thrust = {\n        2  => [\"red\"],          #\"электровоз постоянного тока\"\n        1  => [\"green\"],        #\"электровоз переменного тока\"\n        3  => [\"red\", \"green\"], #\"электровоз  двойного питания\"\n        0  => [\"blue\"],         #\"тепловоз\" \n      }\n      \n      has_depo_type_thrust = {}\n      User::Storage.get('УчасткиОбкаткиОбращенияЛокомотивныхБригад').objects.each do |obj_id, obj|\n        source = obj.источник\n        next if source.nil? || source.empty? || source[\"DOR_АСОУП\"].nil?\n        obj_traction_form = obj.traction_form\n        paint = (obj_traction_form && obj_traction_form.источник && obj_traction_form.источник[\"SPA3755\"]) ? color_type_thrust[obj_traction_form.источник[\"SPA3755\"]] : []\n        has_depo_type_thrust[source[\"DOR_АСОУП\"][0..1]] ||= {}\n        has_depo_type_thrust[source[\"DOR_АСОУП\"][0..1]][source[\"DOR_АСОУП\"][2..3]] ||=[]\n        \n        has_depo_type_thrust[source[\"DOR_АСОУП\"][0..1]][source[\"DOR_АСОУП\"][2..3]] += paint\n\n      end\n      \n      \n      rez = []\n      User::Storage.get('ЭксплуатационныеЛокомотивныеДепо').objects.each do |obj_id, obj|\n        next if obj.получить_тип_предприятия.nil? || obj.получить_тип_предприятия.obj_id != type_ent_id\n        source = obj.источник\n        next if source.nil? || source.empty? || source[\"КОД ЦНСИ\"].nil?\n        #next if params[\"cnsi\"] and params[\"cnsi\"].to_i != obj.получить_ЦНСИ.to_i\n        \n        paint = has_depo_type_thrust[source[\"КОД ЦНСИ\"][2..3]] ? has_depo_type_thrust[source[\"КОД ЦНСИ\"][2..3]][source[\"КОД ЦНСИ\"][4..5]] : []\n\n        rez << { :id => source[\"КОД ЦНСИ\"].to_i, :name => obj.short_name2, :paint => Array(paint).uniq}\n      end\n      \n      return rez.sort{|x,y| x[:name] <=> y[:name]}, rez.size\n    rescue => ex\n      method = (self.to_s + \".\" + __method__.to_utf.to_s).gsub(/User::/,'')\n      User::err \" AjaxMAP :: Ошибка в методе #{method}. #{ex}\\n. #{(ex.respond_to?(:cause) ? ex.cause : \"-\")}\\n. #{ex.backtrace}\\n\"\n      raise ex\n    end\n},\n\t\t:_self_get_uth_percentofteamlap => %q{    def self.get_uth_percentofteamlap(params = Hash.new)\n      # self-method для выдачи данных из модели UTH_PercentOfTeamLap\n      # # @raise [ArgumentError] если не найдена модель\n      # # @return [nil]\n      # # @author Вернер Д.А.\n      # @date \n      # # @source $TfsSource: 'MAP_001/24_AjaxMAP__self_get_uth_percentofteamlap.rb' - 2019-07-31 14:05:52 $\n      # @needs [FrontEnd]\n      # @tasks []\n      \n      result      = []\n      sorted      = []\n      model_name  = :UTH_PercentOfTeamLap \n      model_descr = User::Model.get model_name\n      raise \"Отсутствует модель #{model_name}\" unless model_descr \n\t\t\tmodel_params = \t{\n                        :load         => false,                                              \n                        :depo         => params[\"depo\"]\n                      }\n\n      row_hash = User::Service.get_models_column model_name, model_params\n      \n      if params[\"load\"].to_s == \"true\" # вернуть данные таблицы   \n\t\t\t\tmodel_params[:load] \t\t\t= true\n\t\t\t\tmodel = model_descr.instantiate model_params\n        model.populate\n\n        range = ( 0 ... model.objects.size )\n        for i in range\n          hs = {}\n          row_hash.each_key do |key|\n            hs[key] = model.getValueAt(i, row_hash[key][:column]).to_s\n          end\n          sorted << hs\n        end\n\n        start  = ( params[\"page\"].to_i - 1 ) * params[\"limit\"].to_i\n        ending = start + params[\"limit\"].to_i - model.objects.size < 0 ? start + params[\"limit\"].to_i : model.objects.size\n\n        range = (params[\"page\"] and params[\"limit\"]) ? ( start ... ending ) : ( 0 ... model.objects.size )\n\n        for i in range\n          result << sorted[i]\n        end\n      \n\t\t\t\treturn result, model.objects.size, nil, nil, model_name\n      end\n\n      if params[\"load\"].to_s == \"false\" #вернуть заголовки таблицы\n        return nil, nil, row_hash, nil, model_name        \n      end\n\n    ensure\n      model.stop if model\n    end\n},\n\t\t:tbl_get_КоординатыСтанцииs => %q{\n# $TfsSource: 'MAP_001/26_AjaxMAP__self_tbl_get_КоординатыСтанцииs.rb' - 2019-07-31 14:05:52 $\n    def self.tbl_get_КоординатыСтанцииs(params = Hash.new)\n      if params[:io]\n        io = params[:io]\n      else\n        raise \"No IO\"\n      end\n      model_name  = :КоординатыСтанции_mdl\n      model_descr = User::Model.get model_name\n      raise \"Отсутствует модель КоординатыСтанции_mdl\" unless model_descr\n      # параметры модели\n      model_params = { load: true }\n      model    = model_descr.instantiate model_params\n      row_hash = User::Service.get_models_column model_name, { load: false }\n      # вернуть данные таблицы\n      if params[\"load\"] == \"true\"\n        model.populate\n        size = model.objects.size\n        # разбиение на страницы\n        start  = ( params[\"page\"].to_i - 1 ) * params[\"limit\"].to_i\n        ending = ( start + params[\"limit\"].to_i - size ) < 0 ? ( start + params[\"limit\"].to_i ) : size\n        range  = ( start ... ending )  # формирование запроса необходимых строк по параметрам page и limit\n        hs = {}\n        first = true\n        begin\n          io.write '\"data\":['\n          for i in range\n            row_hash.each_key do |key|\n              hs[key] = model.getValueAt(i, row_hash[key][:column]).to_s\n            end\n            if first\n              io.write hs.to_json\n              first = false\n            else\n              io.write ?, + hs.to_json\n            end\n          end\n          io.write \"],\\\"success\\\":true,\\\"totalCount\\\":#{size},\\\"settings\\\":[],\\\"type\\\":null,\\\"model_name\\\":\\\"#{model_name}\\\"\"\n          return nil\n        rescue Exception => ex\n          io.write '],'\n          method = (self.to_s + \".\" + __method__.to_utf.to_s).gsub(/User::/,'')\n          User::err \" ISUZT :: Ошибка в методе #{method}. #{ex}\\n. #{(ex.respond_to?(:cause) ? ex.cause : \"-\")}\\n. #{ex.backtrace}\\n\"\n          raise ex\n        end\n      end\n      #вернуть заголовки таблицы\n      if params[\"load\"] == \"false\"\n        begin\n          io.write '\"settings\":'\n          io.write row_hash.to_json\n          io.write \",\\\"success\\\":true,\\\"totalCount\\\":0,\\\"data\\\":[],\\\"type\\\":null,\\\"model_name\\\":\\\"#{model_name}\\\"\"\n          return nil\n        rescue Exception => ex\n          io.write '{},'\n          method = (self.to_s + \".\" + __method__.to_utf.to_s).gsub(/User::/,'')\n          User::err \" ISUZT :: Ошибка в методе #{method}. #{ex}\\n. #{(ex.respond_to?(:cause) ? ex.cause : \"-\")}\\n. #{ex.backtrace}\\n\"\n          raise ex\n        end\n      end\n    ensure\n      model.stop if model\n    end\n}\nend","settings":0,"type":"0","model_name":"0"}