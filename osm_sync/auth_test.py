import requests
import urlparse

from secrets import *
import json


def test():
    request = True
    authorize = True
    access = True
    url = secrets['local']['url']
    user = secrets['local']['user']
    username = secrets['local']['username']
    request_tokens = secrets['local']['request_tokens']

    if request:
        request_url = url + '/oauth/request_token'
        res = requests.post(request_url, None)
        print res
        print res.text
        rough_tokens = urlparse.parse_qs(res.text)
        # each item in the dict is a list with only one item
        request_tokens = {}
        for key in rough_tokens:
            request_tokens[key] = rough_tokens[key][0]
        print request_tokens

    if authorize:
        auth_url = url + '/oauth/add_active_directory_user'
        auth_data = {
            'query': request_tokens,
            'userId': user,
            'name': username
        }
        header = {
            'Content-type': 'application/json',
            'Accept': 'text/plain'
        }
        res = requests.post(auth_url, data=json.dumps(auth_data), headers=header)
        print res
        display_name = res.text
        print display_name

    if access:
        access_url = url + '/oauth/access_token'
        auth = ('OAuth ' +
                'oauth_token="' + request_tokens['oauth_token'] + '", ' +
                'oauth_token_secret="' + request_tokens['oauth_token_secret'] + '"')
        header = {'authorization': auth}
        res = requests.request('post', url=access_url, headers=header)
        print res
        print res.text
        tokens = urlparse.parse_qs(res.text)
        print tokens


if __name__ == '__main__':
    test()
